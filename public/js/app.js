'use strict';
$(document).ready(function(){
  console.log('what is the problem');
  $('.updateForm').hide();

  $('.updateButton').click(() => {
    $('.updateForm').toggle();
    $('#menuItems').fadeToggle(170);
  });
});
