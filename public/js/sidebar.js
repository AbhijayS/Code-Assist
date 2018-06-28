$( document ).ready(function() {

  var scroll;
  var exitBtn = `
  <a href="" class="close-button">
    <div class="in">
      <div class="close-button-block"></div>
      <div class="close-button-block"></div>
    </div>
    <div class="out">
      <div class="close-button-block"></div>
      <div class="close-button-block"></div>
    </div>
  </a>
  `;

  var MC_FORM = `
  <div id="mc-sidebar" class="text-center">
    <div class="jumbotron text-center">
      <h1>FREE Cheat-Sheet</h1>
    </div>

    <div class="container-fluid text-center">
      <div class="row">
        <div class="col-md-6">
          <a target="__blank" href="http://eepurl.com/dzb5Sz"><div id="mc-campaign-1-pic"></div></a>
        </div>

        <div class="col-md-4">
          <!-- Begin MailChimp Signup Form -->
          <link href="//cdn-images.mailchimp.com/embedcode/slim-10_7.css" rel="stylesheet" type="text/css">
          <style type="text/css">
          #mc_embed_signup{background:#fff; clear:left; font:14px Helvetica,Arial,sans-serif; }
          /* Add your own MailChimp form style overrides in your site stylesheet or in this style block.
          We recommend moving this block and the preceding CSS link to the HEAD of your HTML file. */
          </style>
          <div id="mc_embed_signup">
          <form action="https://codeassist.us18.list-manage.com/subscribe/post?u=c43395920c7f592fa0641204f&amp;id=1b3428df61" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate>
          <div id="mc_embed_signup_scroll">
          <label for="mce-EMAIL"><h2>Get your Limited Edition!</h2></label>
          <input type="email" value="" name="EMAIL" class="email" id="mce-EMAIL" placeholder="email address" required>
          <!-- real people should not fill this in and expect good things - do not remove this or risk form bot signups-->
          <div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="b_c43395920c7f592fa0641204f_1b3428df61" tabindex="-1" value=""></div>
          <div class="clear"><input type="submit" value="Download PDF" name="subscribe" id="mc-embedded-subscribe" class="button"></div>
          <span style="font-size: 12px; text-align: left;">*subscribe to email updates</span>
          </div>
          </form>
          </div>

          <!--End mc_embed_signup-->
        </div>
      </div>
    </div>
  </div>
  `
  /*
  =================
  Campaign 1: Opt-in 1 - PDF Cheat Sheet - Top 5 Self-learning tools to improve your programming skills Today
  =================
  */
  $('#campaign-1-ad').click(function(event) {
    event.preventDefault();
    if($( window ).width() >= 400 && $( window ).height() >= 400){
      $('html').append(MC_FORM);
      $(window).css("background-color: grey");
      $(document).mouseup(function(e){
          var container = $("#mc-sidebar");

          // if the target of the click isn't the container nor a descendant of the container
          if (!container.is(e.target) && container.has(e.target).length === 0)
          {
              $("#mc-sidebar").remove();
          }
      });
    }else{
      window.open('http://eepurl.com/dzb5Sz', '_blank');
    }
  });
});
