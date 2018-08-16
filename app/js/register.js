if('serviceWorker' in navigator){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('/sw.js').then(function(registration){
      console.log("Service Worker registration successfull with scope", registration.scope);
    },function(err){
      console.log('Registration failed: ' + error);
    })
  })
}
