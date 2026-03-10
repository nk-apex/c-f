export default {
  // ===== UPDATE CONFIGURATION =====
  update: {
    autoCheck: false,
    checkInterval: 6,
    autoDownload: false,
    backupBeforeUpdate: true,
    method: "git",

    repository: {
      main: "https://github.com/7silent-wolf/FOXY.git",
      upstream: "https://github.com/nk-apex/c-f.git",
      owner: "https://github.com/7silent-wolf/FOXY.git"
    },

    zipUrl: "https://github.com/nk-apex/c-f/archive/refs/heads/main.zip",

    timeouts: {
      download: 120000,
      extraction: 180000,
      copy: 300000,
      preserve: 30000
    },

    behavior: {
      preserveSession: true,
      preserveConfig: true,
      preserveData: true,
      skipNodeModules: true,
      installDeps: true,
      restartAfterUpdate: true
    }
  },

  // ===== BOT CONFIGURATION =====
  bot: {
    name: "FOXY",
    version: "1.0.0",
    prefix: "*",
    owner: "7silent-wolf",
    github: "https://github.com/7silent-wolf/FOXY"
  }
}
