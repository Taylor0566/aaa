"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "change-password",
  setup(__props) {
    const oldPassword = common_vendor.ref("");
    const newPassword = common_vendor.ref("");
    const confirmPassword = common_vendor.ref("");
    function onOldPasswordInput(e = null) {
      oldPassword.value = e.detail.value;
    }
    function onNewPasswordInput(e = null) {
      newPassword.value = e.detail.value;
    }
    function onConfirmPasswordInput(e = null) {
      confirmPassword.value = e.detail.value;
    }
    function onBackTap() {
      common_vendor.index.navigateBack(new UTSJSONObject({ delta: 1 }));
    }
    function handleSubmit() {
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        const oldPwd = oldPassword.value.trim();
        const newPwd = newPassword.value.trim();
        const confirmPwd = confirmPassword.value.trim();
        const token = common_vendor.index.getStorageSync("uni_id_token");
        if (!token) {
          common_vendor.index.showToast({ title: "请先登录", icon: "none" });
          setTimeout(() => {
            return common_vendor.index.redirectTo({ url: "/pages/user/login/login" });
          }, 1500);
          return Promise.resolve(null);
        }
        if (!oldPwd) {
          common_vendor.index.showToast({ title: "请输入原密码", icon: "none" });
          return Promise.resolve(null);
        }
        if (!newPwd || newPwd.length < 6) {
          common_vendor.index.showToast({ title: "新密码至少6位", icon: "none" });
          return Promise.resolve(null);
        }
        if (newPwd !== confirmPwd) {
          common_vendor.index.showToast({ title: "两次密码不一致", icon: "none" });
          return Promise.resolve(null);
        }
        try {
          common_vendor.index.showLoading({ title: "修改中..." });
          const res = yield common_vendor.er.callFunction({
            name: "user-api",
            data: new UTSJSONObject({
              action: "update-password",
              uniIdToken: token,
              old_password: oldPwd,
              new_password: newPwd,
              confirm_password: confirmPwd
            })
          });
          common_vendor.index.hideLoading();
          const _a = res.result, code = _a.code, message = _a.message;
          if (code === 0) {
            common_vendor.index.showToast({ title: "密码修改成功", icon: "success" });
            setTimeout(() => {
              common_vendor.index.navigateBack();
            }, 1500);
          } else {
            let msg = message || "修改失败";
            if (code === 1002) {
              msg = "原密码错误";
            } else if (code === 401) {
              msg = "请先登录";
            }
            common_vendor.index.showToast({ title: msg, icon: "none", duration: 2e3 });
          }
        } catch (err) {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/user/change-password/change-password.uvue:136", "[修改密码错误]", err);
          common_vendor.index.showToast({ title: "网络异常，请重试", icon: "none" });
        }
      });
    }
    return (_ctx, _cache) => {
      "raw js";
      const __returned__ = {
        a: common_vendor.o(onBackTap),
        b: oldPassword.value,
        c: common_vendor.o(onOldPasswordInput),
        d: newPassword.value,
        e: common_vendor.o(onNewPasswordInput),
        f: confirmPassword.value,
        g: common_vendor.o(onConfirmPasswordInput),
        h: common_vendor.o(handleSubmit),
        i: common_vendor.sei(common_vendor.gei(_ctx, ""), "view")
      };
      return __returned__;
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/user/change-password/change-password.js.map
