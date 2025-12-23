"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/user/login/login.js";
  "./pages/user/register/register.js";
  "./pages/comtent/upload/upload.js";
  "./pages/comtent/list/list.js";
  "./pages/comtent/detail/detail.js";
  "./pages/user/profile/profile.js";
  "./pages/user/change-password/change-password.js";
}
const _sfc_main = common_vendor.defineComponent({
  onLaunch() {
    common_vendor.index.__f__("log", "at App.uvue:5", "App launched");
  },
  onShow() {
  },
  onHide() {
  }
});
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return { app };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
