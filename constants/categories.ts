export const CATEGORIES = {
  'Política':       ['Gobierno Nacional', 'Justicia', 'Elecciones', 'Educación', 'Seguridad'],
  'Economía':       ['Dólar y Mercados', 'Inflación y Consumo', 'Empresas y Negocios', 'Inversiones', 'Emprendedores'],
  'Internacional':  ['EEUU', 'Medio Oriente', 'Europa', 'América Latina', 'Conflictos', 'Geopolítica'],
  'Deportes':       ['Fútbol', 'Mundial 2026', 'Básquet', 'Tenis', 'Rugby'],
  'Sociedad':       ['Salud', 'Bienestar', 'Clima y Ambiente', 'Historias Humanas', 'Tendencias Y Vida'],
  'Tecnología':     ['Inteligencia Artificial', 'Ciencia y Espacio', 'Apps y Redes', 'Innovación', 'Videojuegos'],
  'Entretenimiento/Cultura': ['Cine y Series', 'Música', 'Turismo y Viajes', 'Streaming', 'Autos', 'Viral y Trending','Teatro y Literatura'],
} as const;

export type CategoryName = keyof typeof CATEGORIES;

export const CATEGORY_ICONS: Record<CategoryName, string> = {
  'Política':       'flag',
  'Economía':       'trending-up',
  'Internacional':          'globe',
  'Deportes':       'activity',
  'Sociedad':       'users',
  'Tecnología':     'cpu',
  'Entretenimiento/Cultura': 'heart',
};

export const ALL_TOPICS: string[] = Object.values(CATEGORIES).flat() as string[];