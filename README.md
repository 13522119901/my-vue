# 自己实现vue双向绑定

分三大块：
1. observe 数据劫持监听器（劫持数据重写get/set；保存订阅；通知变更；）；
2. watcher 订阅者（订阅数据；更新视图；）；
3. compile 编译解析（解析模板；初始话、化视图数据；初始化订阅者，绑定更新函数；）；