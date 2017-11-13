$(document).ready(function(){

  // Initiate tooltips
  $('[data-toggle="tooltip"]').tooltip()

  // Automate modals
  if(window.location.hash){
    var hash = window.location.hash
    var $modal = $(hash)
    if(
      $modal.length &&
      $modal.hasClass('modal')
    ) {
      $modal.modal('show')
    }
  }

})
