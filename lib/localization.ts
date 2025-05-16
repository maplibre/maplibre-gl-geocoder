/**
 * Localized values for the placeholder string
 * 
 * @private
 */
const placeholder = {
  // list drawn from https://docs.mapbox.com/api/search/#language-coverage
  'de': 'Suche', // german
  'it': 'Ricerca', //italian
  'en': 'Search', // english
  'nl': 'Zoeken', //dutch
  'fr': 'Chercher',  //french
  'ca': 'Cerca', //catalan
  'he': 'לחפש', //hebrew
  'ja': 'サーチ',  //japanese
  'lv': 'Meklēt', //latvian
  'pt': 'Procurar', //portuguese 
  'sr': 'Претрага', //serbian
  'zh': '搜索', //chinese-simplified
  'cs': 'Vyhledávání', //czech
  'hu': 'Keresés', //hungarian
  'ka': 'ძიება', // georgian
  'nb': 'Søke', //norwegian
  'sk': 'Vyhľadávanie', //slovak
  'th': 'ค้นหา', //thai
  'fi': 'Hae',//finnish
  'is': 'Leita',//icelandic
  'ko': '수색',//korean
  'pl': 'Szukaj', //polish
  'sl': 'Iskanje', //slovenian
  'fa': 'جستجو',  //persian(aka farsi)
  'ru': 'Поиск',//russian,
  "es": "Buscar" //spanish
}

const errorNoResults = {
  'en': 'No results found',
  'de': 'Keine Ergebnisse gefunden',
  "es": "No hay resultados"
}

const errorConnectionFailed = {
  'en': 'There was an error reaching the server',
  'de': 'Verbindung fehlgeschlagen',
  "es": "Error al conectarse al servidor"
}

export default { placeholder, errorNoResults, errorConnectionFailed };
