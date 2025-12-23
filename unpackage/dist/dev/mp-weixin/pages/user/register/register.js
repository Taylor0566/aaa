"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = common_vendor.defineComponent({
  data() {
    return {
      username: "",
      password: "",
      confirmPassword: "",
      isLoading: false
    };
  },
  methods: {
    onRegisterSubmit() {
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        const _a = this, username = _a.username, password = _a.password, confirmPassword = _a.confirmPassword;
        if (!username.trim()) {
          common_vendor.index.showToast({
            title: "请输入用户名",
            icon: "none"
          });
          return Promise.resolve(null);
        }
        if (!password) {
          common_vendor.index.showToast({
            title: "请输入密码",
            icon: "none"
          });
          return Promise.resolve(null);
        }
        if (password.length < 6) {
          common_vendor.index.showToast({
            title: "密码长度至少6位",
            icon: "none"
          });
          return Promise.resolve(null);
        }
        if (password !== confirmPassword) {
          common_vendor.index.showToast({
            title: "两次密码不一致",
            icon: "none"
          });
          return Promise.resolve(null);
        }
        this.isLoading = true;
        try {
          const res = yield common_vendor.er.callFunction({
            name: "user-api",
            data: new UTSJSONObject({
              action: "register",
              username: username.trim(),
              password
            })
          });
          common_vendor.index.__f__("log", "at pages/user/register/register.uvue:114", "注册返回结果:", res);
          const _b = res.result || new UTSJSONObject({}), code = _b.code, message = _b.message, data = _b.data;
          if (code === 0 && data && data.token) {
            const token = data.token, userInfo = common_vendor.__rest(data, ["token"]);
            common_vendor.index.setStorageSync("uni_id_token", token);
            common_vendor.index.setStorageSync("user_info", userInfo);
            common_vendor.index.showToast({
              title: "注册成功",
              icon: "success",
              duration: 1500
            });
            setTimeout(() => {
              common_vendor.index.switchTab({
                url: "/pages/content/list/list"
              });
            }, 1500);
          } else {
            let errorMessage = "注册失败";
            if (message) {
              errorMessage = message;
            } else if (code === 1004) {
              errorMessage = "用户名已存在";
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
          common_vendor.index.__f__("error", "at pages/user/register/register.uvue:158", "注册请求失败:", err);
          let errorMessage = "注册失败，请稍后重试";
          if (err && err.errMsg) {
            errorMessage = err.errMsg;
          } else if (err && err.message) {
            errorMessage = err.message;
          }
          common_vendor.index.showToast({
            title: errorMessage,
            icon: "none",
            duration: 3e3
          });
        } finally {
          this.isLoading = false;
        }
      });
    },
    goBackToLogin() {
      common_vendor.index.redirectTo({
        url: "/pages/user/login/login"
      });
    }
  }
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  "raw js";
  return {
    a: common_vendor.o((...args) => $options.goBackToLogin && $options.goBackToLogin(...args)),
    b: $data.isLoading,
    c: $data.username,
    d: common_vendor.o(($event) => $data.username = $event.detail.value),
    e: $data.isLoading,
    f: $data.password,
    g: common_vendor.o(($event) => $data.password = $event.detail.value),
    h: $data.isLoading,
    i: $data.confirmPassword,
    j: common_vendor.o(($event) => $data.confirmPassword = $event.detail.value),
    k: common_vendor.t($data.isLoading ? "注册中..." : "注册"),
    l: $data.isLoading,
    m: $data.isLoading,
    n: common_vendor.o((...args) => $options.onRegisterSubmit && $options.onRegisterSubmit(...args)),
    o: common_vendor.sei(common_vendor.gei(_ctx, ""), "view")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/user/register/register.js.map
