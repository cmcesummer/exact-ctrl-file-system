let os = require("os");
let fs = require("fs");
let path = require("path");
let http = require("http");
let https = require("https");

let connect = require("connect");
let serveStatic = require("serve-static");
let serveIndex = require("serve-index");

let DIR = path.join(__dirname, "../file");
let PORT = 7777;
let secure = PORT + 1;

let getIPAddress = function() {
    let ifaces = os.networkInterfaces();
    let ip = "";
    for (let dev in ifaces) {
        ifaces[dev].forEach(function(details) {
            if (ip === "" && details.family === "IPv4" && !details.internal) {
                ip = details.address;
                return;
            }
        });
    }
    return ip || "127.0.0.1";
};

let hostname = getIPAddress();

function getQueryString(name, query) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    if (!query) return null;
    let r = query.match(reg);
    if (r != null) {
        return decodeURIComponent(r[2]);
    };
    return null;
}

function getCookie(name, cookie) {
    let arr, reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
    if (!cookie) return null
    if(arr=cookie.match(reg)) {
        return unescape(arr[2]);
    } 
    return null;
}

let app = connect();
app.use(function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

function createPWD(len) {
    len = len || 32;
    const $chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678"; 
    const maxPos = $chars.length;
    let pwd = "";
    for (let i = 0; i < len; i++) {
        pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}

const newPWD = createPWD(10);

function writeError(res, error) {
    res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'})
    res.end(error);
}

const BLACK_LIST = {};
const BLACK_LIST_MAX = 10;

function checkErrorPwd(ip) {
    // 加入黑名单是true
    const errCount = BLACK_LIST[ip];
    if (!errCount) {
        BLACK_LIST[ip] = 1;
    } else {
        BLACK_LIST[ip] = errCount + 1;
    }
    return BLACK_LIST[ip] > BLACK_LIST_MAX
}

const REG = /^::ffff:([1-9\.]*)$/;
app.use((req, res, next) => {
    const ipBefore = req.connection.remoteAddress;
    const query = req._parsedUrl.query;
    const cookie = req.headers.cookie;
    const pwdUrl = getQueryString(`pwd`, query);
    const pwdCook = getCookie(`pwd`, cookie);
    const ip = ipBefore && ipBefore.match(REG)[1];
    if (BLACK_LIST[ip] > BLACK_LIST_MAX) {
        writeError(res, '请联系提供方2')
        return
    }
    console.log(ip, decodeURIComponent(req.url));
    if (!ip) {
        writeError(res, '请通过正常方式访问')
        return
    }
    if (!pwdUrl && !pwdCook) {
        writeError(res, '请询问密码，并填写')
        return
    }
    if (pwdUrl) {
        if (pwdUrl !== newPWD) {
            if (checkErrorPwd(ip)) {
                writeError(res, '请联系提供方')
                return
            } else {
                writeError(res, '密码错误')
                return
            }
        } else {
            res.setHeader("Set-Cookie", [`pwd=${newPWD}`]);
            next()
        }
    } else {
        if (pwdCook !== newPWD) { 
            if (checkErrorPwd(ip)) {
                writeError(res, '请联系提供方')
                return
            } else {
                writeError(res, '请重新询问密码，并填写')
                return
            }
        } else {
            next()
            return
        }
    }

})

app.use(serveStatic(DIR, { index: ["index.html"] }));
app.use(serveIndex(DIR, { icons: true }));



http.createServer(app).listen(PORT, function() {
    // 忽略80端口
    PORT = PORT != 80 ? ":" + PORT : "";
    let url = "http://" + hostname + PORT + "/?pwd=" + newPWD;
    console.log("Running at " + url);
});

// let options = {
//     key: fs.readFileSync(path.join(__dirname, "./keys", "key.pem")),
//     cert: fs.readFileSync(path.join(__dirname, "./keys", "cert.pem"))
// };

// https.createServer(options, app).listen(secure, function() {
//     let url = "https://" + hostname + ":" + secure + "/";
//     console.log("Also running at " + url);
// });
