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

/*
    分為三種使用情形：
    1. 初次登入，改變成登入狀態
    2. 已為登入狀態，reload 網站照樣顯示登入狀態
    3. 未登入狀態

    登入/當初狀態顯示可使用下方 logginOption function
*/

});


$("#signin").click(function () {
  firebase.auth().signInWithPopup(fbProvider).then(function (result) {
    // 登入後的頁面行為
  }).catch(function (error) {
    var errorCode = error.code;
    var errorMessa = error.message;
    console.log(errorCode,errorMessa);
  })
});

$("#signout").click(function () {
  firebase.auth().signOut().then(function() {
    // 登出後的頁面行為
  },function (error) {
    console.log(error.code);
  });
});

$("#submitData").click(function () {
    // 上傳新商品
});

$("#editData").click(function () {
    // 編輯商品資訊
})

$("#removeData").click(function () {
    //刪除商品
})


/*
    三種商品篩選方式：
    1. 顯示所有商品
    2. 顯示價格高於 NT$10000 的商品
    3. 顯示價格低於 NT$9999 的商品

*/


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
    /*
    清空頁面上 (#item)內容上的東西。
    讀取爬回來的每一個商品
    */

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
  /*
    抓取 sinItemData 節點上的資料。
    將名字設定到 sinItemData
    創建 Item 物件，並顯示到頁面上。
  */

  firebase.database().ref("users/"+sinItemData.seller+ "/name").once("value",function (nameSpa) {
    sinItemData.sellerName = nameSpa.val();
    var tempItem = new Item(sinItemData,currentUser);
    $("#items").append(tempItem.dom);
    tempItem.viewBtn.click(function () {
      /*
        用 ViewModal 填入這筆 item 的資料
        呼叫 ViewModal callImage打開圖片
        創建一個 MessageBox 物件，將 Message 的結構顯示上 #message 裡。
      */
      viewMo.writeData({title:sinItemData.title, price: sinItemData.price, descrip: sinItemData.descrip});
      viewMo.callImage(sinItemData.itemKey, sinItemData.seller);
      var messBox = new MessageBox(currentUser, sinItemData.itemKey);
      $("#message").append(messBox.dom);

      /*
        判斷使用者是否有登入，如果有登入就讓 #message 容器顯示輸入框。
        在 MessageBox 上面註冊事件，當 submit 時將資料上傳。
      */
      if (currentUser) {
        $("#message").append(messBox.inputBox);
        messBox.submitFunction = function (word,itemKey,uid) {
          console.log(word,uid);
          var messa = {};
          var sinTimeK = new Date().getTime();
          messa["/messages/"+itemKey+"/"+ sinTimeK+uid+"/time"]= new Date().getTime();
          messa["/messages/"+itemKey+"/"+ sinTimeK+uid+"/message"]= word;
          messa["/messages/"+itemKey+"/"+ sinTimeK+uid+"/userKey"]= uid;
          firebase.database().ref().update(messa);
        }
      }

    /*
    判斷使用者是否有單入，如果有登入就讓 #message 容器顯示輸入框。
    在 MessageBox 上面註冊事件，在 submit 時將資料上傳。
    使用 messageBox.addDialog 讓每一則留言都能顯示上去。
    */
      firebase.database().ref("messages/"+sinItemData.itemKey).orderByChild("time").once("value",function(data) {
        var dataMess = data.val();
        if(dataMess){
          for (var messKey in dataMess) {
            generateDialog(dataMess[messKey], messBox);
          }
        }
      });
    });

    /*
    如果使用者有登入，替 editBtn 監聽事件，當使用者點選編輯按鈕時，將資料顯示上 uploadModal。
    */
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

  firebase.database().ref("users/"+ diaData.userKey).once("value",function (data) {
    var userData = data.val();
    messageBox.addDialog(diaData.message, userData.name, userData.picURL);
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
