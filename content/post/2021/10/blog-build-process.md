+++
title = "博客搭建过程"
date = 2021-10-01T10:31:46+08:00
description = "记录整个博客的搭建记录历史"
draft = false
tags = ["blog搭建", "自动发布", "Github Actions"]
+++

## 采用的框架
博客采用`hugo`静态站点生成器，主题目前使用的是`jane`，不过个人觉得并不是很符合我的口味，有时间还是需要魔改一下。

## 关于自动发布到github

> 关于采用`Github Actions`自动发布`hugo`站点，可以参考 [这篇文章](https://medium.com/zendesk-engineering/a-github-actions-workflow-to-generate-publish-your-hugo-website-f36375e56cf7) 和 [这篇文章](https://lifeni.life/article/deploy-with-github-actions)

在项目根目录添加`.github/workflows/deploy.yml`文件，内容如下：
```yaml
# Workflow to build and deploy site to Github Pages using Hugo

name: Build and Deploy Blog site

on:
  push:
    branches: [ master ]

jobs:
  build-and-deploy:
    
    runs-on: ubuntu-latest

    steps:

      # Step 1 - Checks-out your repository under $GITHUB_WORKSPACE
      - name: Checkout
        uses: actions/checkout@v2
        with:
          submodules: true  # Fetch Hugo themes
          fetch-depth: 0    # Fetch all history for .GitInfo and .Lastmod

      # Step 2 - Sets up the latest version of Hugo
      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: 'latest'

      # Step 3 - Clean and don't fail
      - name: Clean public directory
        run: rm -rf public

      # Step 4 - Builds the site using the latest version of Hugo
      # Also specifies the theme we want to use
      - name: Build
        run: hugo --theme=even

      # Step 5 - Create name file
      - name: Create cname file
        run: echo 'freshswift.net' > public/CNAME

      # Step 6 - Push our generated site to our gh-pages branch
      - name: Deploy
        uses: JamesIves/github-pages-deploy-action@3.7.1
        with:
          ACCESS_TOKEN: ${{ secrets.ACCESS_TOKEN }}
          BRANCH: gh-pages
          FOLDER: public
          CLEAN: true
```

## 关于主题魔改

> https://lifeni.life/ 这个网站的主题感觉挺好看的，有时间可以按照这个主题改一下
