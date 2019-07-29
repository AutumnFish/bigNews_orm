const { Comment, Article,Category,Sequelize } = require("../db")
const Op = Sequelize.Op

const moment = require("moment")

const serverError = res => {
  res.status(500).send({
    code: 500,
    msg: "服务器内部错误"
  })
}

module.exports = {
  // 发表评论
  async post_comment(req, res) {
    // 获取数据
    const { author, content, articleId } = req.body
    // 判断数据
    try {
      // 判断文章id
      const articleRes = await Article.findOne({
        where: {
          id: articleId
        }
      })
      if (!articleRes) {
        return res.send({
          code: 400,
          msg: "文章id有误，请检查"
        })
      }
      // 发表评论
      await Comment.create({
        author,
        content,
        date: moment().format("YYYY-MM-DD HH:mm:ss"),
        state: "待审核",
        articleId
      })
      res.send({
        code: 201,
        msg: "发表成功"
      })
    } catch (error) {
      serverError(res)
    }
  },
  // 评论列表
  async get_comment(req, res) {
    // 获取文章id
    const { articleId } = req.query
    try {
      // 判断文章是否存在
      const articleRes = await Article.findOne({
        where: {
          id: articleId
        }
      })
      // id异常提示
      if (!articleRes) {
        return res.send({
          code: 400,
          msg: "文章id有误,请检查"
        })
      }
      // 查询评论
      const commentRes = await Comment.findAll({
        where: {
          articleId,
          state: "已通过"
        },
        order: [
          // 根据id倒序
          ["id", "DESC"]
        ]
      })
      res.send({
        code: 200,
        msg: "获取成功"
      })
    } catch (error) {
      console.log(error)
      serverError(res)
    }
  },
  // 文章搜索
  async search(req, res) {
    //   res.send('/query')
    // 数据获取
    const { key, type } = req.query
    let { page, perpage } = req.query
    page = parseInt(page)
    perpage = parseInt(perpage)
    if (!page) {
      page = 1
    }
    if (!perpage) {
      perpage = 6
    }
    // 分页数据判断
    if (typeof page != "number" || typeof perpage != "number") {
      return res.send({
        code: 400,
        msg: "页码，或者页容量类型错误"
      })
    }
    // 计算跳过的页码
    const offset = (page - 1) * perpage
    // 查询条件
    let where = { isDelete:0 }
    // 查询关键字
    if (key) {
      where[Op.or] = [
        {
          title: {
            [Op.substring]: key
          },
          content: {
            [Op.substring]: key
          }
        }
      ]
    }
    // 查询类型
    if (type) {
      where["categoryId"] = type
    }
    try {
      // 分页查询
      let pageArticleRes = await Article.findAll({
        // 模糊查询
        where,
        include: [
          {
            model: Comment
          }
        ],
        attributes: { exclude: ["isDelete"] },
        // 分页
        limit: perpage,
        // 跳过页码
        offset
      })
      // 处理评论个数
      pageArticleRes = JSON.parse(JSON.stringify(pageArticleRes))
      pageArticleRes.forEach(v=>{
        v.comments = v.comments.length
      })
      // 总页数
      let totalArticleRes = await Article.findAll({
        // 模糊查询
        where
      })
      res.send({
        code: 200,
        msg: "数据获取成功",
        data: {
          totalCount: totalArticleRes.length,
          data: pageArticleRes
        }
      })
    } catch (error) {
      // console.log(error);
      serverError(res)
    }
    // res.send("/search")
  }
}
