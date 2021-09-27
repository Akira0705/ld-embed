# ld-embed.js

一个web异常监控埋点包

## 介绍

旨在为多项目提前发现异常点，保证了项目的稳定和质量

>可以收集系统捕获异常和手动上报数据。
>
>其中异常包括 unCaught 自动捕获js异常、httpError 接口异常、sourceError 静态资源加载异常、unhandledRejection 未处理promise异常、handledRejection 已处理promise异常、caught 手动上报异常、warn 手动上报警告信息、info 手动上报日志信息。

## Installation and Usage

安装库 `npm install ld-embed`

### ES6

```javascript
import LdEmbed from 'ld-embed';

new LdEmbed({ ... })
```

### script

可以作为独立脚本加载，也可以通过AMD加载器加载
##### 静态引入
```html
// 埋点引入
<script src="/static/js/LdEmbed.min.js"></script>
<script type="text/javascript">
  new LdEmbed({ ... })
</script>
```

## API
  埋点属性提供了apikey 、环境禁用设置、异常上传模式、自定义字段收集等配置信息
```javascript
new LdEmbed({
  silentPromise: true,
  apikey: "API-KEY"
  reportMode: 'onErrorOffline',
  onError: (errorInfo: ErrorInfo) => {
    // 处理单个异常上传
  },
  onErrorBatch: (errorInfoBatch: ErrorInfoBatch) => {
    const errorInfos = errorInfoBatch.list
    // 处理多个异常上传
  },
})
```

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| apikey  |  必填，用于项目区分 | _string_  | - |
| silent  |  是否禁用rebugger | _boolean_  | `false` |
| silentPromise  |  是否收集Promise异常   | _boolean_  | `false` |
| reportMode  |  异常上传模式,可选值为 `onError` 立即上传。 `byNum` 按天存储满多少个上传。 `byDay` 按天上传。`onErrorOffline` 立即上报且支持线下缓存 | _string_  | `onError` |
| reportNum  | byNum上传模式满n个上传数据，缓解服务端压力 | _number_  | `10` |
| limitNum  | byDay上传模式默认超过20个会主动上传数据 | _number_  | `20` |
| onError  | 上传模式为 `onError` `onErrorOffline` 时，接收报错信息 | (error: ErrorInfo) => {}  | - |
| onErrorBatch  | 上传模式为 `byDay` `byNum` 时，接收报错信息 | (error: ErrorInfoBatch) => {}  | - |
| silentVideo  |  是否开启用户行为录制, 异常场景还原 ——— 待开发  | _boolean_  | `false` |

### ErrorInfo
`onError` `onErrorOffline` 回调函数第一个参数的属性

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| apikey  | 必填，用于项目区分 | _string_  | - |
| screenInfo  | 窗口信息，[详细说明](https://www.w3school.com.cn/js/js_window_screen.asp)  | _string_  | - |
| ip  | 当前网络IP地址 | _string_  | - |
| cityNo  | IP省份代码 | _string_  | - |
| cityName  | IP省份名称 | _string_  | - |
| width  | 访问者屏幕宽度像素 | _number_  | - |
| height  | 访问者屏幕高度像素 | _number_  | - |
| colorDepth  | 硬件的色彩分辨率，[详细说明](https://www.w3school.com.cn/js/js_window_screen.asp)  | _string_  | - |
| pixelDepth  | 屏幕的像素深度 | _string_  | - |
| language  | 浏览器语言 | _string_  | - |
| browser  | 浏览器名称 | _string_  | - |
| coreVersion  | 浏览器版本号 | _string_  | - |
| OS  | 浏览器平台（操作系统） | _string_  | - |
| agent  | 浏览器发送到服务器的用户代理报头（user-agent header） | _string_  | - |
| url  | 报错页面当前URL | _string_  | - |
| online  | 浏览器是否在线 | _boolean_  | - |
| env  | 当前项目环境 `dev` `test` `pre` | _string_  | - |
| name  | 报错类型 `SyntaxError` `ReferenceError` `TypeError` `RangeError` `EvalError` `URIError`，[详细说明](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/SyntaxError)，最大长度254  | _string_  | - |
| message  | 有关错误信息，最大长度2040 | _string_  | - |
| fileName  | 引发此错误的文件的路径. | _string_  | - |
| lineNumber  | 抛出错误的代码在其源文件中所在的行号 | _string_  | - |
| columnNumber  | 引发此错误的文件行中的列号 | _string_  | - |
| componentName  | Vue框架 报错组件名称 | _string_  | - |
| type  | 错误类型 `unCaught` `sourceError` `httpError` | _string_  | - |
| emitTime  | 当前设备时间 | _Date_  | - |
| stack  | 函数的堆栈追踪字符串，最大长度60000 | _string_  | - |
| src  | 资源加载异常时，所请求的资源地址 | _string_  | - |
| tagName  | 资源加载异常时，节点的标签. 例 `script` `img` 等 | _string_  | - |
| selector  | 节点在文档里的选择器位置 | _string_  | - |
| outerHTML  | 节点的完整HTML | _string_  | - |
| status  | Promise异常和资源异常的`HTTP请求错误码` | _string_  | - |
| statusText  | HTTP请求错误描述 | _string_  | - |

### ErrorInfoBatch

`onErrorBatch` 回调函数第一个参数的属性

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| list  | 错误信息的数组 | ErrorInfo[] | - |

## 手动上报

代码中主动上报 建议挂载到全局对象上

```javascript
// 实例化的对象挂载都 global 上
window.Rebugger = new LdEmbed({ ... })

// 使用日志对象时必须先判断该对象是否存在
if ( Rebugger ) {
  ...
  Rebugger.上报方法(上报信息对象);
}

// 安全使用 添加try catch
try {
  if ( Rebugger ) {
    ...
    Rebugger.上报方法(上报信息对象);
  }
} catch (error) {
    
}
```

## 框架错误
如果你使用的是Vue，那么在new前需要把类挂载在window的`Vue`上。包里检测到有全局Vue将重写`Vue.config.errorHandler()`

```javascript
new Vue({ ... }).$mount('#app')

window.Vue = Vue

new LdEmbed({ ... })
```

## 手动上报

1、日志收集

```javascript
Rebugger.reportInfo(errorInfo);
```

2、警告信息

```javascript
Rebugger.reportWarning(errorInfo);
```

3、http请求异常

```javascript
Rebugger.reportHttpError(errorInfo);
```

4、js异常收集

```javascript
Rebugger.reportError(errorInfo);
```

5、promise异常上报

```javascript
Rebugger.reportHandledRejection(errorInfo);
```
