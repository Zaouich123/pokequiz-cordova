const Storage = (function(){
  const FILE_NAME = 'scores.json';

  function isCordova() {
    return typeof window.cordova !== 'undefined' && !!window.cordova;
  }

  function readFromLocalStorage() {
    try {
      const s = localStorage.getItem('poke_scores');
      return Promise.resolve(s ? JSON.parse(s) : []);
    } catch(e) { return Promise.resolve([]); }
  }

  function writeToLocalStorage(arr) {
    try {
      localStorage.setItem('poke_scores', JSON.stringify(arr));
      return Promise.resolve();
    } catch(e){ return Promise.reject(e); }
  }


  function readFromFile() {
    return new Promise((resolve, reject) => {
      if (!isCordova() || !window.resolveLocalFileSystemURL || !cordova.file) {
        resolve(null);
        return;
      }
      const dir = cordova.file.dataDirectory;
      window.resolveLocalFileSystemURL(dir, function(dirEntry){
        dirEntry.getFile(FILE_NAME, {create:true}, function(fileEntry){
          fileEntry.file(function(file){
            const reader = new FileReader();
            reader.onloadend = function() {
              try {
                const txt = reader.result || '[]';
                const data = txt ? JSON.parse(txt) : [];
                resolve(data);
              } catch(e) { resolve([]); }
            };
            reader.readAsText(file);
          }, function(){ resolve([]); });
        }, function(err){ reject(err); });
      }, function(err){ reject(err); });
    });
  }

  function writeToFile(arr) {
    return new Promise((resolve, reject) => {
      if (!isCordova() || !window.resolveLocalFileSystemURL || !cordova.file) {
        resolve(null);
        return;
      }
      const dir = cordova.file.dataDirectory;
      window.resolveLocalFileSystemURL(dir, function(dirEntry){
        dirEntry.getFile(FILE_NAME, {create:true}, function(fileEntry){
          fileEntry.createWriter(function(fileWriter){
            fileWriter.onwriteend = function() { resolve(); };
            fileWriter.onerror = function(e){ reject(e); };


            try {
              fileWriter.truncate(0);
              fileWriter.onwriteend = function() {
                const blob = new Blob([JSON.stringify(arr, null, 2)], {type:'application/json'});
                fileWriter.write(blob);
              };
            } catch(e) {

              const blob = new Blob([JSON.stringify(arr, null, 2)], {type:'application/json'});
              fileWriter.write(blob);
            }
          }, function(err){ reject(err); });
        }, function(err){ reject(err); });
      }, function(err){ reject(err); });
    });
  }

  async function readScores() {
    if (isCordova()) {
      const fromFile = await readFromFile().catch(()=>null);
      if (Array.isArray(fromFile)) return fromFile;
    }
    return readFromLocalStorage();
  }

  async function writeScores(arr) {
    if (isCordova()) {
      try {
        const w = await writeToFile(arr);
        if (w === null) {
          return writeToLocalStorage(arr);
        }
        return;
      } catch(e) {
        return writeToLocalStorage(arr);
      }
    } else {
      return writeToLocalStorage(arr);
    }
  }

  // saveScore: ajoute, trie et garde au plus 100 en mémoire
  async function saveScore(obj) {
    if (!obj || typeof obj.score !== 'number') throw new Error('Bad score object');
    const arr = await readScores();
    arr.push(obj);
    // trier: d'abord score desc, puis temps asc (si temps existe)
    arr.sort((a,b) => {
      if (b.score !== a.score) return b.score - a.score;
      if ((a.time||0) !== (b.time||0)) return (a.time||0) - (b.time||0);
      return new Date(a.date || 0) - new Date(b.date || 0);
    });
    // cap
    const trimmed = arr.slice(0, 100);
    await writeScores(trimmed);
    return trimmed;
  }

  return {
    readScores,
    saveScore
  };
})();
