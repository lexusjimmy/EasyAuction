var config = {
    apiKey: "AIzaSyCCrSYqIkpobs3hP92l6P3U2pScfY2V4v4",
    authDomain: "easyauction.firebaseapp.com",
    databaseURL: "https://easyauction.firebaseio.com",
    storageBucket: "project-989680077496202319.appspot.com",
  };
firebase.initializeApp(config);
var fbProvider = new firebase.auth.FacebookAuthProvider();
ImageDealer.REF = firebase;
var currentUser ;

var uploadMo = new UploadModal($("#upload-modal"));
var viewMo = new ViewModal($("#view-modal"));
var firstTime = true;

firebase.auth().onAuthStateChanged(function (user) {
  if (firstTime) {
    firebase.database().ref("items").on("value",reProduceAll);
    if (user) {
      logginOption(true);
    }else{
      logginOption(false);
    }
    firstTime =false;
    currentUser = user;
  }else if (user && !firstTime) {
    firebase.database().ref("items").once("value",reProduceAll);
    logginOption(true);
    currentUser = user;

  }else {
    firebase.database().ref("items").once("value",reProduceAll);
    logginOption(false);
    currentUser = user;

  }
});


$("#signin").click(function () {
  firebase.auth().signInWithPopup(fbProvider).then(function (result) {
    var user = result.user;
    firebase.database().ref("users").orderByKey().equalTo(user.uid).once("value",function (userD) {
      var newUser ={};
      newUser["/"+user.uid+ "/name"] = user.displayName;
      newUser["/"+user.uid+ "/picURL"] = user.photoURL;
      firebase.database().ref("users").update(newUser);
    });
  }).catch(function (error) {
    var errorCode = error.code;
    var errorMessa = error.message;
    console.log(errorCode,errorMessa);
  })
});

$("#signout").click(function () {
  firebase.auth().signOut().then(function() {
    logginOption(false);
  },function (error) {
    console.log(error.code);
  });
});

$("#submitData").click(function () {
  var dataArr = $("#item-info").serializeArray();
  if (dataArr[0].value != null && dataArr[1].value != null && dataArr[2].value != null && $("#picData")[0].files[0]){
    uploadMo.itemKey = firebase.database().ref("items").push({"title":dataArr[0].value, "price":parseInt(dataArr[1].value), "descrip":dataArr[2].value, "userTime": new Date($.now()).toLocaleString(), "seller": currentUser.uid}).key;
    var tempData = {};
    tempData["/sellItems/"+uploadMo.itemKey]= true;
    firebase.database().ref("users/"+currentUser.uid).update(tempData);
    uploadMo.submitPic(currentUser.uid);
  }
});

$("#editData").click(function () {
  var dataArr = $("#item-info").serializeArray();
  if (dataArr[0].value != null && dataArr[1].value != null && dataArr[2].value != null){
    firebase.database().ref("items/"+ uploadMo.itemKey).update({"title":dataArr[0].value, "price":parseInt(dataArr[1].value), "descrip":dataArr[2].value, "userTime": new Date($.now()).toLocaleString(), "seller": currentUser.uid});
    if ($("#picData")[0].files[0]) {
      uploadMo.submitPic(currentUser.uid);
    }else {
      $("#upload-modal").modal("hide");
    }
  }
})

$("#removeData").click(function () {
  firebase.database().ref("items/"+ uploadMo.itemKey).remove();
  firebase.database().ref("users/"+ currentUser.uid+"/sellItems/"+uploadMo.itemKey).set(null);
  firebase.database().ref("messages/"+ uploadMo.itemKey).remove();
  uploadMo.deletePic(currentUser.uid);
})

$("#price-select span:nth-of-type(1)").click(function (event) {
  firebase.database().ref("items").once("value", reProduceAll);
});

$("#price-select span:nth-of-type(2)").click(function (event) {
  firebase.database().ref("items").orderByChild("price").startAt(10000).once("value",reProduceAll);
});

$("#price-select span:nth-of-type(3)").click(function (event) {
  firebase.database().ref("items").orderByChild("price").endAt(9999).once("value",reProduceAll);
});



function logginOption(isLoggin) {
  if (isLoggin) {
    $("#upload").css("display","block");
    $("#signin").css("display","none");
    $("#signout").css("display","block");
  }else {
    $("#upload").css("display","none");
    $("#signin").css("display","block");
    $("#signout").css("display","none");
  }
}


function reProduceAll(allItems) {
  $("#items").empty();
  var allItemVal = allItems.val();
  var i = 0 ;
  for (var itemKey in allItemVal) {
    var sinItemData = allItemVal[itemKey];
    sinItemData.itemKey = itemKey;
    produceSingleItem(sinItemData);
  }
}
// 每點開一次就註冊一次
function produceSingleItem(sinItemData){
  firebase.database().ref("users/"+sinItemData.seller+ "/name").once("value",function (nameSpa) {
    sinItemData.sellerName = nameSpa.val();
    var tempItem = new Item(sinItemData,currentUser);
    $("#items").append(tempItem.dom);
    tempItem.viewBtn.click(function () {
      viewMo.writeData({title:sinItemData.title, price: sinItemData.price, descrip: sinItemData.descrip});
      viewMo.callImage(sinItemData.itemKey, sinItemData.seller);
      var messBox = new MessageBox(currentUser, sinItemData.itemKey);
      $("#message").append(messBox.dom);
      if (currentUser) {
        $("#message").append(messBox.inputBox);
        messBox.inputBox.keypress(function (e) {
          if (e.which == 13) {
            var messa = {};
            var sinTimeK = new Date().getTime();
            messa["/messages/"+sinItemData.itemKey+"/"+ sinTimeK+currentUser.uid+"/time"]= new Date().getTime();
            messa["/messages/"+sinItemData.itemKey+"/"+ sinTimeK+currentUser.uid+"/message"]= $(this).find("#dialog").val();
            messa["/messages/"+sinItemData.itemKey+"/"+ sinTimeK+currentUser.uid+"/userKey"]= currentUser.uid;
            //messa["/messages/"+sinItemData.itemKey+"/"+ sinTimeK+currentUser.uid+"/name"]= currentUser.displayName;
            firebase.database().ref().update(messa);
            $(this).find("#dialog").val("");
          }
        });
      }

      firebase.database().ref("messages/"+sinItemData.itemKey).orderByChild("time").on("value",function(data) {
        var dataMess = data.val();
        if(dataMess){
          for (var messKey in dataMess) {
            generateDialog(dataMess[messKey], messBox);
          }
        }
      });
    });
    if (tempItem.editBtn) {
      tempItem.editBtn.click(function () {
        uploadMo.editData(sinItemData);
        uploadMo.callImage(sinItemData.itemKey, sinItemData.seller);
      });
    }
  })
}

function generateDialog(diaData, messageBox) {
  $("#message .messages").empty();
  messageBox.refresh();

  firebase.database().ref("users/"+ diaData.userKey).once("value",function (data) {
    var userData = data.val();
    diaData["name"]=userData.name;
    diaData["picURL"]= userData.picURL;
    messageBox.addDialog(diaData);
  })
}

// var dView = new Item({title:"test",price: 1200, seller: "TJI", itemKey:"16520"},true);
// $("#items").append(dView.dom);
//
// dView.editBtn.click(function() {
//   $("#upload-modal").modal("show");
// })
// dView.viewBtn.click(function() {
//   $("#view-modal").modal("show");
//   viewMo.callImage("245")
// })
// $("#submitData").click(function () {
//   uploadMo.submitPic("2453");
// })
