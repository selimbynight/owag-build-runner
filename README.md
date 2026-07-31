# OWAG Build Runner

Orchestrateur public minimal pour lancer les builds des sites OWAG sans exposer
le dépôt source privé. Aucun code client ni secret n'est stocké dans ce dépôt.

Les contrats statiques du workflow se vérifient avec :

```sh
node --test tests/*.test.mjs
```
