// type异常类型 warn info caught 手动上报异常 unCaught 自动捕获代码异常 sourceError 资源加载异常 httpError 请求异常 unhandledRejection 未处理promise异常 handledRejection
import utils from './lib/common';
import reportHandller from './lib/reportHandller';

class Logger {
	constructor(options = {}) {
		this.apikey = options.apikey
    // 是否禁用 logger 不收集任何信息
		this.silent = options.silent || false
    // 是否收集Promise异常
		this.silentPromise = options.silentPromise || false
    // 是否开启用户行为录制
		this.silentVideo = options.silentVideo || false
    // 异常上传模式 onError 立即上传 byNum 按天存储满多少个上传 byDay 按天上传 onErrorOffline 立即上报且支持线下缓存
		this.reportMode = options.reportMode || 'onError'
    // 满10条数据上报一次
		this.reportNum = options.reportNum || 10
    // 缓存数据最大数
		this.limitNum = options.limitNum || 20
    // 环境信息
		this.env = options.env
    // 用户信息
		this.ip = options.ip
		this.cityNo = options.cityNo
		this.cityName = options.cityName

		this.today = `${new Date().getFullYear()}-${
      new Date().getMonth() + 1
    }-${new Date().getDate()}`;

    this.onError = options.onError
    this.onErrorBatch = options.onErrorBatch
    this.onErrorByImg = options.onErrorByImg

    this.init()
  }

  // 初始化 logger 框架内使用
  init() {
    if (!this.apikey) console.warn('logger 缺少apikey');

    if (this.envMoniter()) {
      this.createCityInfo()
      this.proxyWindowError()
    }
  }

  // 发送错误对象信息
  reportObjectByIMG(obj) {
    let paramStr = '';
    for (let key in obj) {
      paramStr = `${paramStr + key}=${obj[key]}&`;
    }

    this.onErrorByImg(paramStr)
  }

  // 上报http异常 用于手动
  reportHttpError(errorInfo, flag = true) {
    errorInfo.type = 'httpError';
    this.reportError(errorInfo, flag);
  }
  
  reportInfo(errorInfo, flag = true) {
    errorInfo.type = 'info';
    this.reportError(errorInfo, flag);
  }
  
  reportWarning(errorInfo, flag = true) {
    errorInfo.type = 'warn';
    this.reportError(errorInfo, flag);
  }

  // 上报promise异常捕获信息 用于手动
  reportHandledRejection(errorInfo, flag = true) {
    errorInfo.type = 'handledRejection';
    this.reportError(errorInfo, flag);
  }

  // 默认type caught 用于手动  flag是否需要获取基础信息baseInfo和MetaData
  reportError(errorInfo, flag = true) {
    // 是否需要获取基础信息 立即发送
    if (flag) {
      let initParam = {
        apikey: this.apikey,
        ip: this.ip,
        cityNo: this.cityNo,
        cityName: this.cityName,
        emitTime: new Date(),
        type: errorInfo.type ? errorInfo.type : 'caught',
      };
      let baseInfo = utils.getBaseInfo();
      let metaData = this.getMetaData(errorInfo.metaData);
      errorInfo = Object.assign({}, initParam, baseInfo, errorInfo, metaData);
    }

    this.onError && this.onError(errorInfo)
  }

  // 批量上传异常数据
  reportErrorList(list, flag = true) {
    let dataObj = {
      list,
    };

    if (flag) {
      // 获取baseInfo等基础信息
    }

    this.onErrorBatch && this.onErrorBatch(dataObj)
  }

  initVueErrorHandler(vue) {
    let self = this

    vue.config.errorHandler = function (err, vm, info) {
      // handle error
      // `info` 是 Vue 特定的错误信息，比如错误所在的生命周期钩子
      // 只在 2.2.0+ 可用
      console.error('捕获 Vue errror', err);
      // console.log(info);
      let componentName = utils.getComponentName(vm);
      let propsData = vm.$options && vm.$options.propsData;
      let {
        message, // 异常信息
        name, // 异常名称
        fileName, // 异常脚本url
        lineNumber, // 异常行号
        columnNumber, // 异常列号
        stack, // 异常堆栈信息
      } = err;

      let initParam = {
        apikey: self.apikey,
        ip: self.ip,
        cityNo: self.cityNo,
        cityName: self.cityName,
      };

      let stackStr = stack.toString();
      let arr = stackStr.split(/[\n]/);
      if (arr.length > 1 && !fileName) {
        let str = arr[1];
        let tempArr = str.split('(');
        if (tempArr.length == 2) {
          str = tempArr[1];
          let tmpArr = str.split(':');
          if (tmpArr.length > 1) {
            lineNumber = tmpArr[tmpArr.length - 2];
            columnNumber = tmpArr[tmpArr.length - 1];
            fileName = str.replace(`:${lineNumber}:${columnNumber}`, '');
            columnNumber = columnNumber.replace(')', '');
            // console.log(lineNumber);
            // console.log(columnNumber);
            // console.log(fileName);
          }
        }
      }
      let errorInfo = {
        name,
        message: `${name}:${message}`,
        fileName,
        lineNumber,
        columnNumber,
        componentName,
        type: 'unCaught',
        emitTime: new Date(),
        propsData: propsData ? JSON.stringify(propsData) : '',
        stack: stack.toString(),
      };
      let baseInfo = utils.getBaseInfo();
      let metaData = self.getMetaData();
      let params = Object.assign({}, initParam, baseInfo, metaData, errorInfo);
      // console.log(params);
      reportHandller.report(self, params);
    };
  }

  // 格式化上报数据
  formatErrorInfo(errorInfo) {
    // 内容截取
    if (errorInfo.message && errorInfo.message.length > 2040) {
      errorInfo.message = errorInfo.message.substring(0, 2040);
    }
    if (errorInfo.stack && errorInfo.stack.length > 60000) {
      errorInfo.stack = errorInfo.stack.substring(0, 60000);
    }

    if (errorInfo.name && errorInfo.name.length > 254) {
      errorInfo.name = errorInfo.name.substring(0, 254);
    }
    return errorInfo;
  }

  getMetaData(defaultInfo) {
    defaultInfo = defaultInfo || {};
    let metaData = defaultInfo;

    // 其它途径获取的metaData ...
    return { metaData: JSON.stringify(metaData) };
  }

  // 环境检测
  envMoniter () {
    if (this.silent === true) {
      console.log('silent true');
      return false;
    }

    return true
  }

  // 获取客户端ip和城市信息
  createCityInfo () {
    if (!this.cityName || !this.cityNo) {
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "https://pv.sohu.com/cityjson?ie=utf-8";
      document.body.appendChild(script);
      script.onload = () => {
        if (window.returnCitySN) {
          this.ip = returnCitySN.cip;
          this.cityNo = returnCitySN.cid;
          this.cityName = returnCitySN.cname;
        }
      }
    }
  }

  proxyWindowError () {
    let initParam = {
      apikey: this.apikey,
      ip: this.ip,
      cityNo: this.cityNo,
      cityName: this.cityName,
    };

    // 初始化 reportHandller
    reportHandller.init(this);
    
    window.addEventListener(
      'error',
      (event) => {
        // 过滤js error
        let target = event.target || event.srcElement;
        let isElementTarget =
          target instanceof HTMLScriptElement ||
          target instanceof HTMLLinkElement ||
          target instanceof HTMLImageElement;
        if (!isElementTarget) {
          // js报错
          let fileName, lineNumber, columnNumber;
          fileName = event.filename;
          lineNumber = event.lineno;
          columnNumber = event.colno;
          let title = event.message;
          let stack = event.error ? event.error.stack : '';
          let errorInfo = {
            name: event.message,
            message: event.message,
            fileName,
            lineNumber,
            columnNumber,
            type: 'unCaught',
            emitTime: new Date(),
            stack: stack.toString(),
          };
          let baseInfo = utils.getBaseInfo();
          let metaData = this.getMetaData();
          let params = Object.assign(
            {},
            initParam,
            baseInfo,
            metaData,
            errorInfo
          );
          // console.log(params);
          reportHandller.report(this, params);
        } else {
          // 上报资源地址
          let src = target.src || target.href;
          // console.log("资源加载异常", event);
          let tagName = target.tagName;
          let outerHTML = target.outerHTML;
          let selector = '';
          let paths = event.path;

          if (
            tagName === "IMG" && 
            outerHTML.indexOf('src=""') > -1
          ) {
            return
          }

          if (paths && paths.length > 0) {
            paths.reverse();
            // console.log(paths);
            let arr = [];
            if (paths.length > 4) {
              arr = paths.slice(paths.length - 5);
            } else {
              arr = paths;
            }
            arr.forEach((item, index) => {
              let className = item.className
                ? `.${item.className.replace(/\s+/g, '.')}`
                : '';
              let tagName = item.tagName || item.nodeName || 'window'

              if (index == arr.length - 1) {
                selector = selector + tagName.toLowerCase() + className;
              } else {
                selector = `${
                  selector + tagName.toLowerCase() + className
                } > `;
              }
            });
          } else {
            // 通过parentNode来寻找 先不递归 按层获取
            let selectorArr = [];
            let currentNode = target;
            let tagName = currentNode.tagName.toLowerCase();
            let className = currentNode.className
              ? `.${currentNode.className.replace(/\s+/g, '.')}`
              : '';
            if (tagName != 'body') {
              selectorArr.push(tagName + className);
              currentNode = currentNode.parentNode;
              tagName = currentNode.tagName.toLowerCase();
              className = currentNode.className
                ? `.${currentNode.className.replace(/\s+/g, '.')}`
                : '';
              if (tagName != 'body') {
                selectorArr.push(tagName + className);
                currentNode = currentNode.parentNode;
                tagName = currentNode.tagName.toLowerCase();
                className = currentNode.className
                  ? `.${currentNode.className.replace(/\s+/g, '.')}`
                  : '';
                if (tagName != 'body') {
                  selectorArr.push(tagName + className);
                  currentNode = currentNode.parentNode;
                  tagName = currentNode.tagName.toLowerCase();
                  className = currentNode.className
                    ? `.${currentNode.className.replace(/\s+/g, '.')}`
                    : '';
                  selectorArr.push(tagName + className);
                }
              }
            }
            selectorArr.reverse();
            selectorArr.forEach((item, index) => {
              if (index == selectorArr.length - 1) {
                selector += item;
              } else {
                selector = `${selector + item} > `;
              }
            });
          }

          // outerHTML XPath status 404 statusText selector
          let errorInfo = {
            name: 'sourceError',
            message: '资源加载异常',
            src,
            tagName,
            outerHTML,
            status: 404,
            statusText: 'Not Found',
            selector,
            emitTime: new Date(),
            type: 'sourceError',
          };
          let baseInfo = utils.getBaseInfo();
          let metaData = this.getMetaData();
          let params = Object.assign(
            {},
            initParam,
            baseInfo,
            metaData,
            errorInfo
          );
          // console.log(params);
          reportHandller.report(this, params);
        }
      },
      true
    );

    // 被Vue捕获的错误
    if (window.Vue) {
      this.initVueErrorHandler(window.Vue);
    }
    
    if (this.silentPromise) {
      // 未处理的promise错误 rejectionhandled unhandledrejection
      window.addEventListener('unhandledrejection', (event) => {
        // 错误的详细信息在reason字段
        // demo:settimeout error
        // console.log('未处理的promise错误', event);
        let message = event.reason.message;
        let stack = event.reason.stack;
        let type = 'unhandledRejection';
        if (!message && !stack) {
          message = 'caught promise error';
          stack = JSON.stringify(event.reason);
        }
        let errorInfo = {
          name: event.reason.stack ? event.reason.stack.name : message,
          message,
          stack,
          type,
          columnNumber: event.reason.columnNumber,
          fileName: event.reason.fileName,
          lineNumber: event.reason.lineNumber,
          emitTime: new Date(),
        };
        let reason = event.reason;
        let metaData = {};
        // 未处理网络promiase异常
        if (message == 'Network Error' || message == '网关超时') {
          type = 'httpError';
          errorInfo.type = 'httpError';
          if (reason.config) {
            let requestInfo = {
              method: reason.config.method,
              url: reason.config.url,
              headers: reason.config.headers,
            };
            errorInfo.src = reason.config.url;
            metaData = Object.assign(metaData, requestInfo);
            let responseInfo = {};
            // 未验证 待验证
            if (reason.response) {
              errorInfo.status = reason.response.status;
              errorInfo.statusText = reason.response.statusText;
            }
          }
        }
        // 未处理promise里面的语法异常
        if (
          message != 'Network Error' &&
          message != 'caught promise error' &&
          message != '网关超时'
        ) {
          let stackStr = event.reason.stack.toString();
          let arr = stackStr.split(/[\n]/);
          let fileName, lineNumber, columnNumber;
          if (arr.length > 1 && arr[1].indexOf('at') != -1 && !errorInfo.fileName) {
            let str = arr[1];
            let tempArr = str.split('(');
            if (tempArr.length == 2) {
              str = tempArr[1];
              let tmpArr = str.split(':');
              if (tmpArr.length > 1) {
                lineNumber = tmpArr[tmpArr.length - 2];
                columnNumber = tmpArr[tmpArr.length - 1];
                fileName = str.replace(`:${lineNumber}:${columnNumber}`, '');
                columnNumber = columnNumber.replace(')', '');
                // console.log(lineNumber);
                // console.log(columnNumber);
                // console.log(fileName);
                errorInfo.lineNumber = lineNumber;
                errorInfo.columnNumber = columnNumber;
                errorInfo.fileName = fileName;
              }
            }
          }
        }
        // console.log(errorInfo);
        let baseInfo = utils.getBaseInfo();
        metaData = this.getMetaData(metaData);
        let params = Object.assign({}, initParam, baseInfo, metaData, errorInfo);
        // console.log(params);
        reportHandller.report(this, params);
      });

      // 处理的promise错误
      window.addEventListener('rejectionhandled', (event) => {
        // 错误的详细信息在reason字段
        // demo:settimeout error
        // console.log('rejectionhandled promise error', event);
        let title = event.reason.message;
        let stack = event.reason.stack;
      });
    }

  }

	// 用户操作跟踪
  evtMoniter () {
    // ... TODO
  }

}

export default Logger