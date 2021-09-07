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

## 埋点属性
  埋点属性提供了apikey 、环境禁用设置、异常上传模式、自定义字段收集等配置信息
```javascript
new LdEmbed({
  useCustomField: true,
  silentDev: false,
  apikey: "API-KEY"
})
```
动态接入属性配置 通过setAttribute方法配置埋点属性, 例如:
```javascript
new LdEmbed({
  useCustomField: true,
  silentDev: false,
  reportMode: 'onError'
  apikey: "API-KEY"
})
```
## API

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| apikey  |  必填，用于项目区分 | _string_  |  |
| silent  |  是否禁用rebugger | _boolean_  | `false` |
| silentDev  |  是否收集开发环境的错误  | _boolean_  | `false` |
| silentTest  |  是否收集测试环境的错误  | _boolean_  | `false` |
| silentPre  |  是否收集预发布环境的错误   | _boolean_  | `false` |
| reportMode  |  异常上传模式 onError 立即上传 byNum 按天存储满多少个上传 byDay 按天上传 onErrorOffline 立即上报且支持线下缓存 | _string_  | `onError` |
| useCustomField  |  是否收集自定义字段，保存在metaData里面   | _boolean_  | `false` |
| customField  | 通过埋点设置必须是json字符串建议在埋点后script标签里面定义，配置的数据将被保存在metaData字段里面 | _object_  | `false` |
| silentVideo  |  是否开启用户行为录制, 异常场景还原 ——— 待开发  | _boolean_  | `false` |

### 其它属性

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| reportNum  | byNum上传模式满n个上传数据，缓解服务端压力 | _number_  | `10` |
| limitNum  | byDay上传模式默认超过20个会主动上传数据 | _number_  | `20` |
| baseUrl  | 定义上报服务器地址 | _string_  | `http://localhost:9090` |

```javascript
/**
 * 配置自定义上报字段 这些字段将会以JSON字符串的形式保存在metaDta字段里
 * 可配置用户ID等标识
 */
new LdEmbed({
  customField: {
    userName: {
      origin: "localStorage",
      paths: "user.userName"
    },
    userId: {
      origin: "localStorage",
      paths: "user.id"
    }
  }
})
```

## 上报接口

> 代码中主动上报 使用全局Rebugger对象

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

errorInfo 字段信息对照

```javascript
// 异常字段
ReportFieldV = {
  日志名称: "name",
  异常信息: "message",
  异常堆栈: "stack",
  异常文件: "fileName",
  所在文件行: "lineNumber",
  所在文件列: "columnNumber",
  其它信息: "metaData",
  异常组件: "componentName",
  组件参数: "propsData",
  资源接口地址: "src",
  状态码: "status",
  状态内容: "statusText",
}
```