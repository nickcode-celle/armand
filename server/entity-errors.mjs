export class EntityError extends Error{constructor(message,status=500,code='ENTITY_ERROR'){super(message);this.name='EntityError';this.status=status;this.code=code}}
export const badRequest=(message,code='BAD_REQUEST')=>new EntityError(message,400,code);
export const busy=(message='Entity occupée, réessaie dans un instant')=>new EntityError(message,409,'ENTITY_BUSY');
export const dependency=(message,code='DEPENDENCY_ERROR')=>new EntityError(message,502,code);
export function httpError(error){if(error?.status&&error?.code)return error;if(/occupée|Lease Entity perdu|Revision Entity obsolète|Conflit/i.test(error?.message||''))return busy(error.message);if(/OPENAI_API_KEY|Identité Entity|Message vide|JSON invalide|trop volumineuse/i.test(error?.message||''))return badRequest(error.message);if(/OpenAI|Entity recall|Entity storage/i.test(error?.message||''))return dependency(error.message);return new EntityError(error?.message||'Erreur Entity',500,'INTERNAL_ERROR')}
