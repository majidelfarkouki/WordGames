# Application "Jeu de mots" côté serveur
---
## Résumé

Ce serveur est destiné à répondre aux requêtes de l'application en lui renvoyant les données demandées stockées en cache.   

## <a name="documentation"></a>Documentation

### Architecture

Application sur architecture **MEAN** (**MongoDB**, **Express.js**, **Angular**, **Node.js**) où **MongoDB** est la base de données **NoSQL** qui contient collection **JSON** par lettre de l'alaphabet. Chaque collection contient des enregistrements au format 

```json
{
    "word" : "le term",
    "weight" : 0 // Le poids du terme
}
```

**Angular** est le framework utilisé pour développer la partie 'client' de notre application.   
Enfin, **Node.js** et **Express.js** sont utilisés pour faire tourner le serveur.

### Fonctionnement

#### Les routes

1. `/auto-compl/:caracters`   
Cette routes fait appel à une fonction qui va questionner la base de données MongoDB pour récupérer les suggestions pour l'auto-complétion

2. `/loadTerm/:term`   
Cette routes appel la fonction `loadTerm`qui vérifie si le term est contennu dans le cache.   
Si c'est le cas, on renvoie un réponse positive au client ce qui lui indique que les données sont prètes à être envoyées.  
Sinon on fait appel à la fonction qui va récupérer toutes les données liées au term recherché sur le serveur `jeuxdemots.org`   
Une fois toutes les données récupérées on les format pour les mettre dans le cache au format **JSON**   
Enfin on renvoie une réponse positive au client lui indiquant que les données sont prètes à être envoyées.   
Dans le cas d'une erreur on retourne une réponse négartive au client avec l'erreur survenue

3. `/getDefinitions/:term`
Cette routes appel la fonction qui renvoie le contenu du fichier de défintions du term contenu dans le cache (e.g. `cache/j/jeux olympiques/definitions.json`)

4. `/getIncomiongs/:term`
Cette routes appel la fonction qui renvoie le contenu du fichier des relations entrantes du term contenu dans le cache (e.g. `cache/j/jeux olympiques/incomings.json`)

5. `/getOutgoings/:term`
Cette routes appel la fonction qui renvoie le contenu du fichier des relations sortantes du term contenu dans le cache (e.g. `cache/j/jeux olympiques/outgoings.json`)

#### Processus

1. On reçoit la demande du terme
2. Si le terme existe on vérifie si le terme est déjà présent dans le cache
3. Si le terme n'est pas déjà dans le cache (sinon on passe à l'étape **7.**)
4. On aspire la page web contenant les informations liées au terme du serveur `jeuxdemots.org`
5. On parse la page pour extraire et formater les données
6. On sauvegarde les données dans leurs fichiers **JSON** respectifs dans le cache
7. On envoie une réponse positive au client, si une erreur est survenue pendant la création du cache on retourne l'erreur
8. On reçoit simultanément les demandes de définitions, de relations entrantes et sortantes
9. On retourne à chaque fois le contenu **JSON** de chacun des fichier de cache respectifs