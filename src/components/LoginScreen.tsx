import { useState } from "react";
import { BellRing, Eye, EyeOff, Grid3X3, MapPinned, Radio, ShieldCheck, Smartphone, Swords } from "lucide-react";
import type { UserMode } from "../types";

export function LoginScreen({ onLogin }: { onLogin: (mode: UserMode, username: string, password: string) => void }) {
  const [mode, setMode] = useState<UserMode>("player");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const selectMode = (nextMode: UserMode) => {
    setMode(nextMode);
  };

  return (
    <main className="login-page" id="main-content">
      <section className="login-hero" aria-labelledby="login-title">
        <div className="brand-lockup brand-lockup--large">
          <span className="brand-mark" aria-hidden="true">H</span>
          <div>
            <strong>HRG // LIVE</strong>
            <span>LOCAL COMPETITION SYSTEM</span>
          </div>
        </div>

        <div className="login-hero__copy">
          <p className="eyebrow eyebrow--light">SESSION 01 · SYSTEM READY</p>
          <h1 id="login-title">ENTER<br /><span>THE GRID.</span></h1>
          <p>任务、道具、实时定位都在同一块控制面板。比赛期间请保持 App 在前台。</p>
        </div>

        <div className="login-hero__features" aria-label="产品能力">
          <div><Grid3X3 size={20} aria-hidden="true" /><span>BINGO TASKS</span></div>
          <div><Swords size={20} aria-hidden="true" /><span>TACTIC CARDS</span></div>
          <div><MapPinned size={20} aria-hidden="true" /><span>LIVE LOCATION</span></div>
        </div>

        <div className="login-signal" aria-hidden="true">
          <span><Radio size={16} />LIVE</span>
          <i /><i /><i /><i /><i />
          <b>01:47:32</b>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel__inner">
          <div>
            <p className="eyebrow">ACCESS GATE / 01</p>
            <h2>进入比赛</h2>
            <p className="muted-copy">选择身份，登录活动账号。</p>
          </div>

          <div className="role-switch" role="tablist" aria-label="账号类型">
            <button
              role="tab"
              aria-selected={mode === "player"}
              className={mode === "player" ? "is-active" : ""}
              onClick={() => selectMode("player")}
            >
              <Smartphone size={18} aria-hidden="true" />
              玩家账号
            </button>
            <button
              role="tab"
              aria-selected={mode === "staff"}
              className={mode === "staff" ? "is-active" : ""}
              onClick={() => selectMode("staff")}
            >
              <ShieldCheck size={18} aria-hidden="true" />
              工作人员
            </button>
          </div>

          <form
            className="login-form"
            onSubmit={(event) => {
              event.preventDefault();
              onLogin(mode, username, password);
            }}
          >
            <label>
              <span>账号</span>
              <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="请输入账号" />
            </label>
            <label>
              <span>密码</span>
              <span className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="请输入密码"
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "隐藏密码" : "显示密码"}>
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </span>
            </label>
            <button className="button button--primary button--full" type="submit">
              登录
            </button>
          </form>

          <div className="device-note">
            <BellRing size={20} aria-hidden="true" />
            <div>
              <strong>正式活动需安装 PWA</strong>
              <p>比赛会检查通知、相机和定位权限；本地演示不会申请。</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
