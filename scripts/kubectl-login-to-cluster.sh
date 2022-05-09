#!/bin/bash
kubectl config set-cluster main-cluster --server="$KUBE_CLUSTER_URL"
kubectl config set-context --current --namespace="$FRENTLY_DEPLOYMENT_NAME"
kubectl config set-context main-cluster --cluster=main-cluster
kubectl config set-credentials user --token="$KUBE_SERVICE_ACCOUNT_TOKEN"
kubectl config set-context main-cluster --user=user
kubectl config use-context main-cluster