var sapiens = document.getElementById("sapiens");

sapiens.onmouseover = function() {
  sapiens.style.fontSize = "120%";
  sapiens.style.backgroundColor = "lightgrey";
  sapiens.style.color = "black";
  document.getElementById("tagline").style.color = "black";
}

sapiens.onmouseleave = function() {
  sapiens.style.fontSize = "3em";
  sapiens.style.backgroundColor = "black";
  sapiens.style.color = "white";
  document.getElementById("tagline").style.color = "white";
}