const photo = (id: string, width = 1400): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=70`;

export const PLOT_IMAGES = [
  photo('photo-1500382017468-9049fed747ef'),
  photo('photo-1464226184884-fa280b87c399'),
  photo('photo-1500530855697-b586d89ba3ee'),
  photo('photo-1441974231531-c6227db76b6e'),
  photo('photo-1472214103451-9374bd1c798e'),
  photo('photo-1501785888041-af3ef285b470'),
  photo('photo-1433086966358-54859d0ed716'),
  photo('photo-1464146072230-91cabc968266'),
];

export const HOUSE_IMAGES = [
  photo('photo-1564013799919-ab600027ffc6'),
  photo('photo-1570129477492-45c003edd2be'),
  photo('photo-1600585154340-be6161a56a0c'),
  photo('photo-1600596542815-ffad4c1539a9'),
  photo('photo-1568605114967-8130f3a36994'),
  photo('photo-1583608205776-bfd35f0d9f83'),
  photo('photo-1598228723793-52759bba239c'),
  photo('photo-1572120360610-d971b9d7767c'),
  photo('photo-1605276374104-dee2a0ed3cd6'),
  photo('photo-1600047509807-ba8f99d2cdbc'),
];

export const VILLA_IMAGES = [
  photo('photo-1613490493576-7fde63acd811'),
  photo('photo-1600607687939-ce8a6c25118c'),
  photo('photo-1512917774080-9991f1c4c750'),
  photo('photo-1600585154526-990dced4db0d'),
  photo('photo-1613977257363-707ba9348227'),
  photo('photo-1600566753190-17f0baa2a6c3'),
];

export const PROJECT_IMAGES = [
  photo('photo-1545324418-cc1a3fa10c00'),
  photo('photo-1486406146926-c627a92ad1ab'),
  photo('photo-1460317442991-0ec209397118'),
  photo('photo-1580587771525-78b9dba3b914'),
  photo('photo-1574362848149-11496d93a7c7'),
  photo('photo-1494526585095-c41746248156'),
];

export function shots(pool: string[], start: number, count = 3): string[] {
  return Array.from({ length: count }, (_, index) => pool[(start + index) % pool.length]);
}

export function poolFor(type: string): string[] {
  if (type === 'plot' || type === 'agricultural') return PLOT_IMAGES;
  if (type === 'villa') return VILLA_IMAGES;
  if (type === 'apartment' || type === 'commercial') return PROJECT_IMAGES;
  return HOUSE_IMAGES;
}
