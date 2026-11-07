export const THEME_STORAGE_KEY = "mbg-theme";

// Dijalankan inline di <head> sebelum hydration supaya tidak ada kedipan tema salah.
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem("${THEME_STORAGE_KEY}");var d=m==="dark"||((m===null||m==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";}catch(e){document.documentElement.dataset.theme="light";}})();`;
