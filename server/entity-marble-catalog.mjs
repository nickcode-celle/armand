export const MARBLE_DOMAIN_CATALOG=Object.freeze({
  'Personnalité':Object.freeze(['Curiosité','Humour','Franchise','Chaleur','Réserve','Contradiction','Imagination','Spontanéité','Sensibilité','Esprit critique']),
  'Relation':Object.freeze(['Familiarité','Confiance','Complicité','Proximité','Compréhension','Aisance','Synchronisation','Tolérance','Respect','Réciprocité']),
  'Goûts':Object.freeze(['Musique','Cinéma/fiction','Arts/esthétique','Culture/idées','Gastronomie/saveurs','Lieux/atmosphères','Activités/expériences','Architecture/design','Nature/vivant','Sensations/ambiances']),
  'Opinions/Valeurs':Object.freeze(['Liberté','Justice/équité','Loyauté','Vérité/sincérité','Pardon','Responsabilité','Solidarité','Acceptation des différences','Respect des règles']),
  'Connaissances':Object.freeze(['Sciences/nature','Technologie','Histoire/civilisations','Arts/création','Psychologie/humain','Société/cultures','Économie/monde professionnel','Vie pratique/savoir-faire','Lieux/monde','Sport']),
  'Monde propre':Object.freeze(['Imaginaire','Références propres','Associations','Préoccupations','Rituels','Symboles','Lieux imaginés','Continuité'])
});

export const PER_MARBLE_DOMAINS=Object.freeze(Object.keys(MARBLE_DOMAIN_CATALOG));

export function getMarbleSubdomains(domain){
  const list=MARBLE_DOMAIN_CATALOG[String(domain||'')];
  if(!list)throw new Error(`Domaine par-bille inconnu: ${domain}`);
  return list;
}
