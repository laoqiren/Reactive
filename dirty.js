class MVVM {
    constructor(options) {
        this.$data = options.data;
        this.$methods = options.methods;
        this.$watcherList = [];

        this.$compile();
        this.$apply();
    }
    $compile(){
        let bindList = document.querySelectorAll('[lx-bind]');
        let this_ = this;
        for(let i=0,length=bindList.length; i<length; i++){
            let bindData = bindList[i].getAttribute('lx-bind');

            // 添加一个对应的观察者
            let bindWatcher = new Watcher(bindData,(newVal,oldVal)=>{
                bindList[i].innerHTML = newVal; // 监听绑定数据的变化，更新view
            });
            this.$watcherList.push(bindWatcher);
        }

        // 对数据绑定做处理
        let clickList = document.querySelectorAll('[lx-click]');
        for(let i=0,length = clickList.length; i<length; i++){
            clickList[i].onclick = function(){
                let method = this.getAttribute('lx-click');
                this_.$methods[method].call(this_);

                // 执行事件回调后自动触发一次脏检查
                this_.$apply();
            }
        }
    }
    $apply(){
        this.$digest();
    }
    $digest(){
        let dirty = true,
            checkTimes = 0;  // 一次脏检查周期内循环脏检查的次数
        while(dirty){
            dirty = this.$dirtyOnce(); //调用脏检查
            checkTimes++;
            if(checkTimes>10&&dirty){  // 循环脏检查次数达到10次，dirty还是为true则报错
                throw new Error("脏检查超过10次，建议优化代码");
            }
        }
        
    }
    $dirtyOnce(){
        let dirty = false;
        let list = this.$watcherList;
        for(let i=0,length=list.length; i<length; i++){
            let watcher = list[i];
            let newVal = watcher.getNewValue(this); // 获取watcher监听的属性的最新值
            let oldVal = watcher.last;
            if(newVal !== oldVal){ // 如果和上次的值不同则调用相应的回调，且标记dirty为true
                dirty = true;
                watcher.listener(newVal,oldVal);
                watcher.last = newVal;
            }
        }
        return dirty;
    }
    $watch(prop,listener){
        this.$watcherList.push(new Watcher(prop,listener));
    }
}

class Watcher {
    constructor(prop,listener){
        this.prop = prop;
        this.listener = listener || function(){};
        this.last = undefined;
    }
    getNewValue(scope){
        return scope.$data[this.prop];
    }
}

let vm = new MVVM({
    data: {
        name: "luoxia",
        year: 21,
        intro: "大家好，我来自美丽的山城重庆！"
    },
    methods: {
        sayName(){
            this.$data.name = "Jack";
            console.log("hello,my name is", this.$data.name);
        }
    }
});

vm.$watch("name",(newVal,oldVal)=>{
    console.log(`name的值变化了，新值：${newVal}，旧值：${oldVal}`);
});

vm.$watch("year",(newVal,oldVal)=>{
    console.log(`year的值变化了，新值：${newVal}，旧值：${oldVal}`);
})

vm.$data.year = 22;
//vm.$apply();