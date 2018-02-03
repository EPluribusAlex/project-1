var app = {

  userModule : {

    username : localStorage.getItem('cryptoClash-name'),

    init: function(){

      if( !this.username ){ // if no username is saved
        $('#welcome-modal').modal('show'); // open the modal
        $('#welcome-modal').off('click'); // remove the background click event
        $('.modal-accept').on('click' , function(){

          var input = $('#nickname-input').val().trim();

          if( input != '' ){ // check if nickname is not empty
            app.userModule.username = input;
            localStorage.setItem('cryptoClash-name' , input); // saving username
            $('#welcome-modal').modal('hide');
            $('#main-app').css('opacity','1');
          }

        });
      }
      else if(this.username){
        $('#main-app').css('opacity','1');
      }

    }
  },

  priceHistoryModule : {

    activeCurrency: 'BTC',

    data: '',

    getPrices: function( ){

      var queryURL = 'http://hidden-savannah-78793.herokuapp.com/api/history/'+ this.activeCurrency;

      $.ajax({
        url: queryURL,
        method: "GET"
      }).then(function(result) {

        app.priceHistoryModule.data = result;
        app.priceHistoryModule.renderPrices();

      }).fail(function(err) {
        throw err;
      });
    },

    renderPrices: function( ){
      var chartLine = {
        x: [],
        y: [],
        type: 'scatter'
      };

      for( var i = 0; i < this.data.length; i++ ){
        var date = moment.unix( this.data[i].date );
        chartLine.x.push( date.format('YYYY-M-D') );
        chartLine.y.push( this.data[i].price );
      }

      var data = [chartLine]

      var layout = {
        title: this.activeCurrency + " prices in the last week",
        showlegend: false,
        height: 290,
        autosize: true,
        margin: { t: 30 , l: 50 , r: 20 , b: 50 }
      }

      var options = {
        displayModeBar: false,
        scrollZoom: false
      }

      Plotly.newPlot( 'price-chart', data , layout , options );
    },

    init: function () {
      this.getPrices('BTC');

      $(window).on('resize' , function(){
        app.priceHistoryModule.renderPrices();
      });

      $('.topic-tab').on('click' , function(e){
        var ticker = $(e.target).attr('data-coin');
        app.priceHistoryModule.activeCurrency = ticker;
        app.priceHistoryModule.getPrices();
      });
    },


  },

  pollModule : {

    pollState:0,
    init:function () {
      var fbConfig = {
      apiKey: apiKey.firebase,
      authDomain: "test-project-59866.firebaseapp.com",
      databaseURL: "https://test-project-59866.firebaseio.com",
      projectId: "test-project-59866",
      storageBucket: "test-project-59866.appspot.com",
      messagingSenderId: "766361558341"
    }
      firebase.initializeApp(fbConfig);
      var db = firebase.database(); 
      var voted = [];     
      db.ref().on('value',function(snapshot){
        app.pollModule.pollState = snapshot.val();
        //console.log(app.pollModule.pollState);
        
        voted=snapshot.child('voted').val();
        if (voted.indexOf(app.userModule.username)>=0){
          $('#pollForm').hide(); 
          $('#poll-chart').show();
          app.pollModule.renderPolls(app.pollModule.pollState)
        }
        else{$('#poll-chart').hide(); $('#pollForm').show('200');}
      });
      $('#pollForm').submit(function(event){
        event.preventDefault();
        voted.push(app.userModule.username)
        db.ref('voted').set(voted);
        var vote = $('input[name=vote]:checked', this).val();
        console.log(vote);
        app.aniModule.renderScreen($('input[name=vote]:checked', this).attr('id'));
        app.priceHistoryModule.activeCurrency=vote;
        app.priceHistoryModule.getPrices();
        app.pollModule.pollState[vote]++;
        app.pollModule.renderPolls(app.pollModule.pollState);
        db.ref().set(app.pollModule.pollState);              
      });

      $(document).ready(function (){
        app.pollModule.renderPolls(app.pollModule.pollState);
      });
      $(window).on('resize' , function(){
        app.pollModule.renderPolls(app.pollModule.pollState);
      });


    },

    renderPolls: function (state) {

      var data = {
       labels: ["Bitcoin","Dogecoin","Ethereum","Ripple"],
       values: Object.getOwnPropertyNames(state).map(x => state[x]),
       type:'pie'
      };
      data = [data];

      var layout = {
        title: "Vote on your favourite cryptocurrency",
        showlegend: true,
        height: 290,
        autosize: true,
        margin: { t: 30 , l: 50 , r: 20 , b: 40 }
      }

      var options = {
        displayModeBar: false,
        scrollZoom: false
      }

      Plotly.newPlot( 'poll-chart', data , layout , options );
    }
 
  },

  newsModule : {

    apiKey: apiKey.news,
    baseURL: "https://newsapi.org/v2/everything?q=", 

    topics: [
    "bitcoin",
    "ethereum",
    "ripple",
    "dogecoin"
    ],

    queries: [
    "wkRel",
    "wkPop",
    "mnthRel",
    "mnthPop"
    ],

    // stores articles pulled from ajax call as properties under the topic name, organized by search query type
    articles: {
      wkRel: {},
      wkPop: {},
      mnthRel: {},
      mnthPop: {}
    },

    currQuery: "wkRel",
    currTopic: "bitcoin",

    init: function () {

      app.newsModule.topics.forEach(function(a) {
        app.newsModule.queries.forEach(function(b) {
          app.newsModule.artGet(a, b);
        });
      });

      // listens for topic link selection, then renders appropriate articles
      $(".topic-tab").on("click", function() {

        app.newsModule.currTopic = $(this).text().toLowerCase();
        app.newsModule.artDisplay(app.newsModule.currTopic, app.newsModule.currQuery);
        app.aniModule.renderScreen(app.newsModule.currTopic);

      });

      // listens for change in article search preferences
      $(".dropdown-item").on("click", function() {

        const newSel = $(this).text();

        if(newSel === "Most Relevant" || newSel === "Most Popular") {

          $("#dropdownMenuButton1").html('<em>' + newSel + '</em>');

          switch(app.newsModule.currQuery) {
            case "wkRel":
              if(newSel === "Most Popular") {
                app.newsModule.currQuery = "wkPop";
              }
              break;
            case "wkPop":
              if(newSel === "Most Relevant") {
                app.newsModule.currQuery = "wkRel";
              }
              break;
            case "mnthRel":
              if(newSel === "Most Popular") {
                app.newsModule.currQuery = "mnthPop";
              }
              break;
            case "mnthPop":
              if(newSel === "Most Relevant") {
                app.newsModule.currQuery = "mnthRel";
              }
              break;
          }

        } else {

          $("#dropdownMenuButton2").html('<em>' + newSel + '</em>');

          switch(app.newsModule.currQuery) {
            case "wkRel":
              if(newSel === "Last Month") {
                app.newsModule.currQuery = "mnthRel";
              }
              break;
            case "wkPop":
              if(newSel === "Last Month") {
                app.newsModule.currQuery = "mnthPop";
              }
              break;
            case "mnthRel":
              if(newSel === "Last Week") {
                app.newsModule.currQuery = "wkRel";
              }
              break;
            case "mnthPop":
              if(newSel === "Last Week") {
                app.newsModule.currQuery = "wkPop";
              }
              break;
          }

        }

        app.newsModule.artDisplay(app.newsModule.currTopic, app.newsModule.currQuery);

      });

    },

    artGet: function(topic, query) {

      let time, interval, sort;

      if(query === "wkRel") {
        time = 7;
        interval = "days";
        sort = "relevancy";
      } else if(query === "wkPop") {
        time = 7;
        interval = "days";
        sort = "popularity";
      } else if(query === "mnthRel") {
        time = 1;
        interval = "months";
        sort = "relevancy";
      } else if(query === "mnthPop") {
        time = 1;
        interval = "months";
        sort = "popularity";
      } else {
        console.log("query error");
      }

      const toDate = moment().format("YYYY-MM-DD"),
            fromDate = moment().subtract(time, interval).format("YYYY-MM-DD");
            queryURL = app.newsModule.baseURL + topic + "$from=" + fromDate + "&to=" + toDate + "&language=en&sortBy=" + sort + "&pageSize=10&apiKey=" + app.newsModule.apiKey;

      $.ajax({
        url: queryURL,
        method: "GET"
      }).then(function(result) {

        const x = result.articles;

        Object.defineProperty(app.newsModule.articles[query], topic, {
          value: x
        });

        if(topic === app.newsModule.currTopic && query === app.newsModule.currQuery) {
          app.newsModule.artDisplay(topic, query);
        }

      }).fail(function(err) {
        throw err;
      });

    },

    artDisplay: function(topic, query) {

      const arrX = app.newsModule.articles[query][topic];

      $("#articles").empty();

      arrX.forEach(function(article) {

        let div = $("<div>").addClass("container article"),

        h4 = $("<h4>").text(article.title),
        img = $("<img>").addClass("article-img").attr("src", article.urlToImage),
        pAuth = $("<p>").addClass("article-author").text(article.author),
        pBod = $("<p>").addClass("article-body").html('<em>' + article.description + '</em>'),
        a = $("<a>").addClass("art_link").attr("href", article.url).attr("target", "_blank").html("<button class='accept article-btn'>View Article</button");

        div.append(h4);
        
        if( article.urlToImage ){ // check it the artcle has an image before appending
          div.append(img);
        }
        
        div.append(pAuth).append(pBod).append(a);

        $("#articles").append(div);

      }); 

      let divSrc = $("<div>").addClass("container").html("<p><em>Articles provided by Newsapi.org</em></p>");
      $("#articles").append(divSrc);

    }

  },

  chatModule : {

    socket : io(),

    parseMessage : function( msg ){
      return '<strong class="chat-user">'+ msg.name +':</strong> <span class="chat-message">' + msg.message + '</span>'
    },

    init: function () {
      $('#chatForm').submit(function (event) { // hook the chat form submit
        event.preventDefault();
        var newMessage = $('#m').val();

        if (newMessage != '') {
          newMessage = 
          { 
            'name' : app.userModule.username, 
            'message' : newMessage
          }
          app.chatModule.socket.emit('chat message', newMessage); 
          $('#m').val('');
        }

        return false;
      });

      //get all messages and populate message history
      $.get( "http://hidden-savannah-78793.herokuapp.com/api/messages/", function( response ) {
        return response }).done(function( data ){
          for( var i = 0; i < data.length; i++ ){
            $('#messages').prepend($('<li>').html( app.chatModule.parseMessage( data[i] ) ));
          }
          $('#message-display').scrollTop(9999999);
        })

        app.chatModule.socket.on('chat message', function (msg) {
          $('#messages').append($('<li>').html( app.chatModule.parseMessage( msg ) ));
          $('#message-display').scrollTop(9999999);
          app.aniModule.quickRender(app.aniModule.currPreset);
        });

      }

  },

  aniModule: {

    currPreset: "bitcoin",

    presets: {

      bitcoin: {
        primary: "#f7931a",
        secondary: "#4d4d4d"
      },

      ethereum: {
        primary: "#3C3C3D",
        secondary: "#C99D66"
      },

      ripple: {
        primary: "#007a7b",
        secondary: "#d4fff6"
      },

      dogecoin: {
        primary: "#e1b303",
        secondary: "#000000"
      },
      
    },

    init: function() {

      app.aniModule.renderScreen("start");

    },

    renderScreen: function(x) {

      if(x === "start") {

        console.log("Bitcoin color scheme already in place");

      } else if(app.aniModule.presets[x] != undefined) {

        app.aniModule.currPreset = x;

        const a = $(".navbar"),
              b = $("#messages li:nth-child(odd)"),
              c = $("#footer"),
              d = $(".navbar-brand"),
              e = $(".nav-link.topic-tab"),
              f = $(".section-header")
              g = $(".dropdown-toggle");
              
        TweenMax.to(a, 1, {
          backgroundColor: app.aniModule.presets[x].primary,
          color: app.aniModule.presets[x].secondary });
        TweenMax.to(b, 1, {
          backgroundColor: app.aniModule.presets[x].primary,
          color: app.aniModule.presets[x].secondary });
        TweenMax.to(c, 1, {
          backgroundColor: app.aniModule.presets[x].primary,
          color: app.aniModule.presets[x].secondary });
        TweenMax.to(d, 1, {
          color: app.aniModule.presets[x].secondary });
        TweenMax.to(d, 1, {
          color: app.aniModule.presets[x].secondary });
        TweenMax.to(e, 1, {
          color: app.aniModule.presets[x].secondary });
        TweenMax.to(f, 1, {
          backgroundColor: app.aniModule.presets[x].primary,
          color: app.aniModule.presets[x].secondary });
        TweenMax.to(g, 0.5, {
          backgroundColor: app.aniModule.presets[x].primary,
          color: app.aniModule.presets[x].secondary }); 

      } else {

        console.log(x + "is not an available preset");
        app.aniModule.renderScreen("bitcoin");

      }

    },

    quickRender: function(x) {
      $("#messages li:nth-child(odd)").attr("style", "background-color: " + app.aniModule.presets[x].primary + "; color: " + app.aniModule.presets[x].secondary + ";");
    }

  },

  startup : function(){

    this.userModule.init();
    this.priceHistoryModule.init();
    this.pollModule.init();
    this.newsModule.init();
    this.chatModule.init();
    this.aniModule.init();

    var tl = new TimelineLite();

    tl.add( TweenLite.from( $('.section-ticker')  , .5, { ease: Power2.easeInOut , y: 50, opacity: 0 , delay: 0.4 } ) );
    tl.add( TweenLite.from( $('.section-poll')    , .5, { ease: Power2.easeInOut , y: 50, opacity: 0 }, "-=0.7" ) );
    tl.add( TweenLite.from( $('.section-articles'), .5, { ease: Power2.easeInOut , y: 50, opacity: 0 }, "-=0.7" ) );
    tl.add( TweenLite.from( $('.section-chat')    , .5, { ease: Power2.easeInOut , y: 50, opacity: 0 }, "-=0.7" ) );

  }

};

app.startup(); // main entry point of this application