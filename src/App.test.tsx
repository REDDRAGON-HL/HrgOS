import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";
import { WaitingScreen } from "./components/WaitingScreen";

describe("脱敏页面", () => {
  it("初次打开只呈现登录页且不预填默认凭据", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain("请输入账号");
    expect(markup).not.toContain("player01");
    expect(markup).not.toContain("demo2026");
    expect(markup).not.toContain("同步判定");
  });

  it("等待页只显示指定提示文字", () => {
    const markup = renderToStaticMarkup(<WaitingScreen />);
    expect(markup.replace(/<[^>]*>/g, "")).toBe("请等待游戏开始");
    expect(markup).not.toContain("button");
  });
});
