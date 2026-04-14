import { initializeApp } from 'firebase/app';
import { getAuth, deleteUser, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import firebaseConfigJson from './firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const databaseId = firebaseConfigJson.firestoreDatabaseId;
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, databaseId || '(default)');
const auth = getAuth(app);

async function clearDatabase() {
  console.log('Iniciando limpeza do banco de dados...');
  
  const collections = ['users', 'team_members', 'projects', 'tasks', 'financial_records', 'accesses', 'notifications'];
  
  for (const colName of collections) {
    const colRef = collection(db, colName);
    const snapshot = await getDocs(colRef);
    console.log(`Deletando ${snapshot.size} documentos de ${colName}...`);
    
    const deletePromises = snapshot.docs.map(document => deleteDoc(doc(db, colName, document.id)));
    await Promise.all(deletePromises);
  }
  
  console.log('Limpeza do Firestore concluída.');
  console.log('NOTA: Usuários no Firebase Auth devem ser deletados manualmente no console do Firebase.');
  process.exit(0);
}

clearDatabase().catch(err => {
  console.error('Erro ao limpar banco:', err);
  process.exit(1);
});
