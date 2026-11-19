'use client';
import { useState } from 'react';

// Bitchat: chat por Bluetooth entre celulares cercanos, sin internet (para el avión).
// Nuestra app es web y no puede usar Bluetooth para esto, así que mandamos a la app de Bitchat.
export const BITCHAT = {
  appStore: 'https://apps.apple.com/app/bitchat-mesh/id6748219622',
  playStore: 'https://play.google.com/store/apps/details?id=com.bitchat.droid',
};

function sistema() {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'otro';
}

// iPhone: abre bitchat:// y, si no está instalada (la app sigue a la vista), va al App Store.
// Android: el único link que Bitchat acepta es bitchat://verify (abre la app con la hoja de
// verificación encima, se cierra con "atrás"). Si no está instalada, Chrome va a Play Store.
export function abrirBitchat() {
  const so = sistema();
  if (so === 'ios') {
    const t = setTimeout(() => { if (document.visibilityState === 'visible') window.location.href = BITCHAT.appStore; }, 1500);
    document.addEventListener('visibilitychange', () => clearTimeout(t), { once: true });
    window.location.href = 'bitchat://';
  } else if (so === 'android') {
    window.location.href = `intent://verify#Intent;scheme=bitchat;package=com.bitchat.droid;S.browser_fallback_url=${encodeURIComponent(BITCHAT.playStore)};end`;
  } else {
    window.open(BITCHAT.playStore, '_blank', 'noopener');
  }
}

export default function Bitchat({ guiaAbierta = false }) {
  const [guia, setGuia] = useState(guiaAbierta);
  return (
    <div className="card">
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div>
          <b>✈️ ¿Sin señal en el avión? Usá Bitchat</b>
          <p className="small muted" style={{ margin: '0.2rem 0 0' }}>Chatea por Bluetooth con los celulares de al lado, sin internet.</p>
        </div>
      </div>
      <div className="row" style={{ marginTop: '0.6rem', flexWrap: 'wrap' }}>
        <button className="btn chico" onClick={abrirBitchat}>Abrir Bitchat</button>
        <button className="btn ghost chico" onClick={() => setGuia(!guia)}>{guia ? 'Ocultar guía' : '¿Cómo se usa?'}</button>
      </div>
      {guia && (
        <ol className="small" style={{ margin: '0.7rem 0 0', paddingLeft: '1.2rem', lineHeight: 1.5 }}>
          <li>
            <b>En casa, con internet:</b> bajala gratis (
            <a href={BITCHAT.appStore} target="_blank" rel="noopener">iPhone</a> ·{' '}
            <a href={BITCHAT.playStore} target="_blank" rel="noopener">Android</a>
            ), abrila y dale permiso de Bluetooth. No pide cuenta ni número.
          </li>
          <li><b>En el avión:</b> poné modo avión y después volvé a prender el Bluetooth.</li>
          <li>Abrí Bitchat, poné tu nombre y fijate que arriba diga <b>mesh</b> (el canal por Bluetooth). Ahí aparecen todos los que estén cerca.</li>
          <li className="muted">Ojo: cualquier pasajero del avión con Bitchat también lee ese canal. Para algo privado, tocá el nombre de la persona y mandale un mensaje directo.</li>
          <li className="muted">Consejo: pruébenlo en casa todos juntos en modo avión antes de viajar.</li>
        </ol>
      )}
    </div>
  );
}
