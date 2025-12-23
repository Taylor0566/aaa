"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = common_vendor.defineComponent({
  data() {
    return {
      username: "",
      password: ""
    };
  },
  methods: {
    onLoginSubmit() {
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        const _a = this, username = _a.username, password = _a.password;
        if (!username || !password) {
          common_vendor.index.showToast({ title: "请填写账号和密码", icon: "none" });
          return Promise.resolve(null);
        }
        try {
          const res = yield common_vendor.er.callFunction({
            name: "user-api",
            data: new UTSJSONObject({
              action: "login",
              username,
              password
            })
          });
          common_vendor.index.__f__("log", "at pages/user/login/login.uvue:62", "云函数返回结果:", res);
          const _b = res.result || new UTSJSONObject({}), code = _b.code, message = _b.message, data = _b.data;
          common_vendor.index.__f__("log", "at pages/user/login/login.uvue:66", "解析结果:", new UTSJSONObject({ code, message, data }));
          if (code === 0 && data && data.token) {
            const token = data.token, userInfo = common_vendor.__rest(data, ["token"]);
            common_vendor.index.__f__("log", "at pages/user/login/login.uvue:72", "登录成功，用户信息:", userInfo);
            common_vendor.index.setStorageSync("uni_id_token", token);
            common_vendor.index.setStorageSync("user_info", userInfo);
            common_vendor.index.showToast({
              title: "登录成功",
              icon: "success",
              duration: 1500
            });
            setTimeout(() => {
              common_vendor.index.switchTab({
                url: "/pages/comtent/list/list"
              });
            }, 1500);
          } else {
            common_vendor.index.__f__("error", "at pages/user/login/login.uvue:94", "登录失败:", new UTSJSONObject({ code, message, data }));
            let errorMessage = "登录失败";
            if (message) {
              errorMessage = message;
            } else if (code === 1001) {
              errorMessage = "用户不存在";
            } else if (code === 1002) {
              errorMessage = "密码错误";
            } else if (code === 1003) {
              errorMessage = "账号已被禁用";
            }
            common_vendor.index.showToast({
              title: errorMessage,
              icon: "none",
              duration: 3e3
            });
          }
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/user/login/login.uvue:114", "登录请求失败:", err);
          let errorMessage = "网络错误，请检查网络连接";
          if (err && typeof err === "object") {
            if (err.errCode || err.errMsg) {
              errorMessage = err.errMsg || `错误代码: ${err.errCode}`;
            } else if (err.message) {
              errorMessage = err.message;
            }
          }
          common_vendor.index.showToast({
            title: errorMessage,
            icon: "none",
            duration: 3e3
          });
        }
      });
    }
  }
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  "raw js";
  return {
    a: $data.username,
    b: common_vendor.o(($event) => $data.username = $event.detail.value),
    c: $data.password,
    d: common_vendor.o(($event) => $data.password = $event.detail.value),
    e: common_vendor.o((...args) => $options.onLoginSubmit && $options.onLoginSubmit(...args)),
    f: common_vendor.sei(common_vendor.gei(_ctx, ""), "view")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/user/login/login.js.map
