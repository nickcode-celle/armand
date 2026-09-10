const schedulers=new WeakMap();

/** Un seul événement structurel (naissance ou récompense) peut piloter les billes à la fois. */
export function enqueueEmaeaGraphicTask(runtime,task){
  if(!runtime||typeof runtime!=='object')return Promise.reject(new Error('Runtime graphique EMÆÄ manquant'));
  if(typeof task!=='function')return Promise.reject(new Error('Tâche graphique EMÆÄ invalide'));
  const previous=schedulers.get(runtime)??Promise.resolve();
  const next=previous.catch(()=>{}).then(task);
  schedulers.set(runtime,next);
  return next.finally(()=>{if(schedulers.get(runtime)===next)schedulers.delete(runtime)});
}
