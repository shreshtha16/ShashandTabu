const {onDocumentCreated}=require("firebase-functions/v2/firestore");
const admin=require("firebase-admin");

admin.initializeApp();
const db=admin.firestore();

exports.notifyPartnerOnNote=onDocumentCreated("notes/{noteId}",async event=>{
  const note=event.data?.data();
  if(!note?.text||!note.authorUid)return;
  const tokens=await db.collection("notificationTokens").get();
  const recipients=tokens.docs.map(doc=>doc.data()).filter(x=>x.uid&&x.uid!==note.authorUid&&x.token);
  if(!recipients.length)return;
  await admin.messaging().sendEachForMulticast({
    tokens:recipients.map(x=>x.token),
    notification:{title:"A note from us",body:note.text.slice(0,120)},
    data:{noteId:event.params.noteId}
  });
});
