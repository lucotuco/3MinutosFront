export const CATEGORIES = {
  'Política':       ['Gobierno Nacional', 'Justicia y Corrupción', 'Elecciones', 'Política Provincial', 'Seguridad'],
  'Economía':       ['Dólar e Inflación', 'Mercados', 'Empresas y Negocios', 'Trabajo y Salarios', 'Criptomonedas'],
  'Mundo':          ['EEUU', 'Medio Oriente', 'Europa', 'América Latina', 'Salud Global'],
  'Deportes':       ['Fútbol Local', 'Fútbol Internacional', 'Mundial 2026', 'Básquet', 'Tenis y Otros'],
  'Sociedad':       ['Salud', 'Educación', 'Clima y Ambiente', 'Género', 'Seguridad Ciudadana'],
  'Tecnología':     ['Inteligencia Artificial', 'Ciencia y Espacio', 'Gadgets', 'Internet'],
  'Cultura y Vida': ['Cine y Series', 'Música', 'Turismo y Viajes', 'Libros', 'Autos', 'Bienestar'],
} as const;

export type CategoryName = keyof typeof CATEGORIES;

export const CATEGORY_ICONS: Record<CategoryName, string> = {
  'Política':       'flag',
  'Economía':       'trending-up',
  'Mundo':          'globe',
  'Deportes':       'activity',
  'Sociedad':       'users',
  'Tecnología':     'cpu',
  'Cultura y Vida': 'heart',
};

export const ALL_TOPICS: string[] = Object.values(CATEGORIES).flat() as string[];