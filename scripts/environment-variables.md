# Environment Variables
This is the list of environment variables needed to use this repository.


## Deployment
### Kubernetes Login
Those are the variables needed to access the kubernetes cluster for deployments.
```bash
# How to get a token https://cloudhedge.io/setting-up-kubernetes-api-access-using-service-account/
KUBE_SERVICE_ACCOUNT_TOKEN = "Put here the token"

KUBE_CLUSTER_URL = "https://kubernetes.default"
```

### Deploy Environment

```bash
# This will used as namespace and a prefix for all the resources.
FRENTLY_DEPLOYMENT_NAME = "DEVELOPMENT"
```