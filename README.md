# OWAG Build Runner

Orchestrateur public minimal pour lancer les builds des sites OWAG sans exposer
le dépôt source privé. Aucun code client ni secret n'est stocké dans ce dépôt.

Les contrats statiques du workflow se vérifient avec :

```sh
node --test tests/*.test.mjs
```

## Publication Plump Fluffy Cub's

`plumpfluffycubs.com` est publié uniquement par le workflow coordonné
`build-site`, depuis OWAG-CMS, vers le pool `cloudflare:cf01` et le projet
`plumpfluffycubs-fr`. L'ancien workflow de déploiement de l'artefact figé C14 a
été retiré : il ne doit pas être restauré ni utilisé comme mécanisme de rollback.
Un rollback doit toujours partir d'une publication attestée par le registre CMS.
