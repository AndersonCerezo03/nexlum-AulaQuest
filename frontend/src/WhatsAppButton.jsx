import { useState } from 'react';
import { createElement as e } from 'react';

const WA_NUMBER = '573002629795';
const WA_TEXT = 'Hola Nexlum quiero informacion sobre AulaQuest';

export default function WhatsAppButton() {
  const [hover, setHover] = useState(false);
  const href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(WA_TEXT);

  return e(
    'a',
    {
      href: href,
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': 'WhatsApp',
      onMouseEnter: function () { setHover(true); },
      onMouseLeave: function () { setHover(false); },
      style: {
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: '#25D366',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: hover ? '0 6px 20px rgba(37,211,102,.55)' : '0 4px 14px rgba(0,0,0,.35)',
        transform: hover ? 'scale(1.08)' : 'scale(1)',
        transition: 'transform .2s ease, box-shadow .2s ease',
        zIndex: 99999,
        cursor: 'pointer',
        textDecoration: 'none'
      }
    },
    e(
      'svg',
      { viewBox: '0 0 32 32', width: 34, height: 34, fill: '#fff', 'aria-hidden': 'true' },
      e('path', {
        d: 'M16.003 3.2C9.043 3.2 3.4 8.843 3.4 15.803c0 2.227.583 4.4 1.69 6.314L3.2 28.8l6.86-1.797a12.56 12.56 0 0 0 5.94 1.51h.005c6.96 0 12.603-5.643 12.603-12.603S22.963 3.2 16.003 3.2zm0 22.92h-.004a10.43 10.43 0 0 1-5.314-1.456l-.38-.226-3.97 1.04 1.06-3.87-.248-.397a10.37 10.37 0 0 1-1.59-5.532c0-5.77 4.694-10.464 10.47-10.464 2.796 0 5.424 1.09 7.4 3.067a10.39 10.39 0 0 1 3.064 7.402c0 5.77-4.694 10.464-10.464 10.464zm5.74-7.836c-.314-.157-1.86-.918-2.148-1.023-.288-.105-.498-.157-.708.158-.21.314-.813 1.022-.997 1.232-.183.21-.367.236-.68.079-.315-.158-1.328-.49-2.53-1.562-.935-.834-1.566-1.864-1.75-2.178-.183-.315-.02-.485.138-.642.142-.14.315-.367.472-.55.158-.184.21-.315.315-.525.105-.21.053-.394-.026-.551-.079-.158-.708-1.707-.97-2.337-.255-.613-.515-.53-.708-.54l-.603-.01c-.21 0-.55.078-.838.393-.288.315-1.1 1.075-1.1 2.624 0 1.55 1.127 3.046 1.284 3.256.157.21 2.22 3.39 5.377 4.753.75.324 1.336.518 1.793.663.753.24 1.438.206 1.98.125.604-.09 1.86-.76 2.122-1.494.262-.735.262-1.365.183-1.494-.078-.13-.288-.21-.603-.367z'
      })
    )
  );
}