module.exports = {
  apps: [
    {
      name: "front",
      script: "./node_modules/serve/build/main.js",
      args: "-s /root/chronotracker/front/dist -l 5174",
      cwd: "/root/chronotracker/front",
      env_prod: {
        VITE_NODE_ENV: "prod",
        VITE_STORAGE_WK_KEY: "chrono:lastWorkspaceId"
      },
      env_hom: {
        VITE_NODE_ENV: "hom",
        VITE_STORAGE_WK_KEY: "chrono:lastWorkspaceId"
      }
    },
  ],
};