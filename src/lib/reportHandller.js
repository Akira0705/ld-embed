/* eslint-disable quotes */
/* eslint-disable space-before-function-paren */
import lsUtils from "./lsUtils";
import ajax from "./ajax";
import utils from "./utils";

// 去抖动
let handleDebounce = function(action, delay) {
  let timer = null;

  return function(baseUrl, ls, todayLs, today) {
    // console.log("触发调用", todayLs);
    let self = this;
    if (timer) {
      ls[today] = todayLs;
      lsUtils.set("frontLogger", ls);
    }
    // args = arguments;
    clearTimeout(timer);
    timer = setTimeout(() => {
      // console.log("最后调用", todayLs);
      action.call(self, baseUrl, ls, todayLs, today);
    }, delay);
  };
};

var reportHandller = {
  // 查询当天是否有上报
  init(logger) {
    console.log("init reportHandller");
    // 查询上一日 byNum byDay onErrorOffline 残留未上传数据
    let today = logger.today;
    let baseUrl = logger.baseUrl;
    let ls = lsUtils.getObj("frontLogger", {});
    // let copyLs = JSON.parse(JSON.stringify(ls));
    for (let key in ls) {
      // 判断key是否为日期格式 xxx-xx-xx
      let arr = key.split("-");
      if (arr.length == 3) {
        let isYestoday = utils.CompareDate(today, key);
        // console.log(isYestoday);
        if (isYestoday) {
          // 上传以前数据
          // console.log("上传以前数据");
          let yestodayLs = ls[key];
          if (yestodayLs.list.length > 0) {
            let dataObj = {
              list: yestodayLs.list,
            };
            let options = {
              method: "POST",
              url: `${baseUrl}/api/report/createList`,
              // url: "/cpm/user/login",
              data: dataObj,
            };
            ajax(options)
              .then((res) => {
                console.log("init report success", res);
                // console.log(JSON.parse(res));
                let ret = null;
                if (utils.isString(res) && res.indexOf("{") == 0) {
                  ret = JSON.parse(res);
                }
                if (ret && ret.code == 200) {
                  let reb = lsUtils.getObj("frontLogger", {});
                  let copyLs = JSON.parse(JSON.stringify(reb));
                  delete copyLs[key];
                  // console.log(copyLs);
                  lsUtils.set("frontLogger", copyLs);
                }
              })
              .catch((err) => {
                console.log(err);
              });
          }
        }
      }
    }
    reportHandller.handleDebounceFn = handleDebounce(
      reportHandller.reportByList,
      500
    );
  },
  report(logger, params) {
    let reportMode = logger.reportMode;
    params = logger.formatErrorInfo(params);
    if (params.fileName && params.fileName.indexOf("front_logger.min") != -1) {
      console.warn("front_logger report warn");
      return;
    }
    switch (reportMode) {
      case "onError":
        logger.reportError(params, false);
        // reportHandller.reportByNum(logger, params);
        break;
      case "byNum":
        reportHandller.reportByNum(logger, params);
        break;
      case "byDay":
        reportHandller.reportByDay(logger, params);
        break;
      case "onErrorOffline":
        reportHandller.reportOnErrorOffline(logger, params);
        break;
      default:
        console.warn(`frontLogger > no this reportMode : ${reportMode}`);
        logger.reportError(params, false);
        break;
    }
  },
  reportOnErrorOffline(logger, params) {
    let today = logger.today;
    let limitNum = logger.limitNum;
    let baseUrl = logger.baseUrl;
    let ls = lsUtils.getObj("frontLogger", {});
    let initLs = reportHandller.getInitLs(today);
    let todayLs = ls[today] || initLs[today];
    if (params.online) {
      // 立即发送
      let options = {
        method: "POST",
        url: `${baseUrl}/api/report/create`,
        // url: "/cpm/user/login",
        data: params,
      };
      ajax(options)
        .then((res) => {
          // console.log("success", res);
        })
        .catch((err) => {
          console.log(err);
        });
    } else if (todayLs && todayLs.list) {
      todayLs.list.push(params);
      ls[today] = todayLs;
      lsUtils.set("frontLogger", ls);
    }
  },
  reportByDay(logger, params) {
    let today = logger.today;
    let limitNum = logger.limitNum;
    let baseUrl = logger.baseUrl;
    let ls = lsUtils.getObj("frontLogger", {});
    let initLs = reportHandller.getInitLs(today);
    let todayLs = ls[today] || initLs[today];
    if (todayLs.byNum && todayLs.byNum.list) {
      todayLs.list.push(params);
      // 不能超过最大缓存值
      if (todayLs.list.length > limitNum - 1) {
        let dataObj = {
          list: todayLs.list,
        };
        let options = {
          method: "POST",
          url: `${baseUrl}/api/report/createList`,
          // url: "/cpm/user/login",
          data: dataObj,
        };
        ajax(options)
          .then((res) => {
            console.log("excess limitNum reportByDay success", res);
            let ret = null;
            if (utils.isString(res) && res.indexOf("{") == 0) {
              ret = JSON.parse(res);
            }
            if (ret && ret.code == 200) {
              todayLs.list = [];
              ls[today] = todayLs;
              lsUtils.set("frontLogger", ls);
            }
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        ls[today] = todayLs;
        lsUtils.set("frontLogger", ls);
      }
    }
  },
  handleDebounceFn: null,
  reportByNum(logger, params) {
    let today = logger.today;
    let reportNum = logger.reportNum;
    let baseUrl = logger.baseUrl;
    let ls = lsUtils.getObj("frontLogger", {});
    // console.log(ls);
    let initLs = reportHandller.getInitLs(today);
    let todayLs = ls[today] || initLs[today];
    if (todayLs && todayLs.list) {
      todayLs.list.push(params);
      if (todayLs.list.length > reportNum - 1) {
        // if (true) {
        // console.log("满10条 发送数据 清空缓存");
        reportHandller.handleDebounceFn(baseUrl, ls, todayLs, today);
      } else {
        ls[today] = todayLs;
        lsUtils.set("frontLogger", ls);
      }
    }
  },
  reportByList(baseUrl, ls, todayLs, today) {
    let dataObj = {
      list: todayLs.list,
    };
    let options = {
      method: "POST",
      url: `${baseUrl}/api/report/createList`,
      // url: "/cpm/user/login",
      data: dataObj,
    };
    ajax(options)
      .then((res) => {
        console.log("success", res);
        todayLs.list = [];
        ls[today] = todayLs;
        lsUtils.set("frontLogger", ls);
      })
      .catch((err) => {
        console.log(err);
      });
  },
  getInitLs(today) {
    let initLs = {};
    initLs[today] = {
      list: [],
    };
    return initLs;
  },
};

export default reportHandller;

// 存储数据结构 frontLogger
// {
//   "dayStr":{
//     byNum:{
//       list:[]
//     },
//     byDay:{
//       list:[]
//     },
//     onErrorOffline:{
//       list:[]
//     }
//   }
// }
