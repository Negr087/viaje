// Devuelve [[persona_id, votos], ...] ordenado de más a menos votado
export function ganadores(votos, premioId) {
  const conteo = {};
  for (const v of votos.filter((v) => v.premio === premioId)) {
    conteo[v.nominado_id] = (conteo[v.nominado_id] || 0) + 1;
  }
  return Object.entries(conteo).sort((a, b) => b[1] - a[1]);
}
