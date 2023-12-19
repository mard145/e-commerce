document.addEventListener("DOMContentLoaded", function () {
    // Adiciona uma classe ao corpo após o tempo de carregamento simulado
    setTimeout(function () {
      document.documentElement.classList.add("loading-complete");
      
      // Esconde o elemento de loading
      document.querySelector(".loading").style.opacity = 0;
  
      // Após o fade-out, remove o elemento de loading
      setTimeout(function () {
        document.querySelector(".loading").style.display = "none";
      }, 500); // Tempo de transição no CSS
    }, 1000); // Tempo de loading simulado
  });
  