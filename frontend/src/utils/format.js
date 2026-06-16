export const fmt = (n) => {
  return Number(n).toLocaleString('fr-FR').replace(/\u202f/g, ' ') + ' Ar'
}

export const fmtPDF = (n) => {
  return Number(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ar'
}

export function nombreEnLettres(n) {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf']
  const tens  = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix']

  if (n === 0) return 'zéro'
  if (n >= 1e9) { const m = Math.floor(n/1e9), r = n%1e9; return (m===1?'un milliard':nombreEnLettres(m)+' milliards') + (r>0?' '+nombreEnLettres(r):'') }
  if (n >= 1e6) { const m = Math.floor(n/1e6), r = n%1e6; return (m===1?'un million':nombreEnLettres(m)+' millions') + (r>0?' '+nombreEnLettres(r):'') }
  if (n >= 1000) { const m = Math.floor(n/1000), r = n%1000; return (m===1?'mille':nombreEnLettres(m)+' mille') + (r>0?' '+nombreEnLettres(r):'') }
  if (n >= 100) { const c = Math.floor(n/100), r = n%100; return (c===1?'cent':nombreEnLettres(c)+' cent') + (r>0?' '+nombreEnLettres(r):'') }
  if (n >= 20) { const t = Math.floor(n/10), u = n%10; if (t===7||t===9) return tens[t]+'-'+nombreEnLettres(10+u); return tens[t]+(u?'-'+units[u]:'') }
  return units[n]
}
