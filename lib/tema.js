// Script que corre antes de pintar para que no "parpadee" el tema.
// Vive acá (y no en el componente cliente) para poder usarlo desde el layout del servidor.
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem('tema');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}})();`;
