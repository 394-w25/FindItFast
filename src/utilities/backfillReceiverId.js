import { database } from '../utilities/firebase';
import { ref, get, update } from 'firebase/database';

const backfillReceiverId = async () => {
    const messagesRef = ref(database, 'messages');
    const snapshot = await get(messagesRef);
    const data = snapshot.val();

    if (data) {
        const updates = {};
        Object.entries(data).forEach(([conversationId, messages]) => {
            const [id1, id2] = conversationId.split('_');
            Object.entries(messages).forEach(([messageId, message]) => {
                if (!message.receiverId) {
                    const receiverId = message.senderId === id1 ? id2 : id1;
                    updates[`messages/${conversationId}/${messageId}/receiverId`] = receiverId;
                }
            });
        });
        await update(ref(database), updates);
        console.log('Backfill complete');
    }
};

backfillReceiverId();
