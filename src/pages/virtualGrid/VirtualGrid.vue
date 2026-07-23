<template>
  <div
    class="viewport"
    @scroll="onScroll"
    ref="viewport"
    :style="{ '--rowHeight': rowHeight + 'px' }"
  >
    <!--继承，给raw设置行高，只需要设置一次-->
    <!--  撑出高度 把视口的滚动条遮住，展示全部数据的虚假的滚动条，让人看着数据很多 -->
    <div
      class="scrollbar"
      ref="scrollbar"
    ></div>
    <div
      class="list"
      ref="list"
    >
      <div
        class="raw"
        v-for="item in sliceList"
      >
        {{ item.n }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, toRaw, computed, nextTick } from 'vue'
let bigList = ref()
let viewport = ref()
let scrollbar = ref()
let list = ref()
let viewCount = ref(20) // 可视区展示的条数
let rowHeight = ref(20) // 元素行高
onMounted(() => {
  let list = new Array(200000).fill(null).map((item, i) => ({ n: i + 1 }))
  bigList.value = Object.freeze(list)
  // 设置视口的高度
  viewport.value.style.height = rowHeight.value * viewCount.value + 'px'
  // 滚动条的高度 所有数据 每一行的行高 * 全部数量的长度
  scrollbar.value.style.height = rowHeight.value * bigList.value.length + 'px'
})
// 截取的开始结束
let startIndex = ref(0)
let endIndex = ref(20)
let sliceList = computed(() => {
  return bigList.value?.slice(startIndex.value, endIndex.value)
})

// 视口滚动
function onScroll() {
  let offsetTop = viewport.value.scrollTop || 0 // 视口卷去的高度
  startIndex.value = Math.round(offsetTop / rowHeight.value) // 下一次开始截取的index，是把数组移上去了的那里开始
  endIndex.value = startIndex.value + viewCount.value // 下一次的结束，确保显示的是规定的viewCount.value
  // 操作列表，把可视区卷上去的元素，平移回来，视口区需要展示viewCount.value个元素，不平移回来的话，一直往上卷，后面视口区就没元素了
  list.value.style.transform = `translateY(${offsetTop}px)`
  nextTick(() => {
    scrollbar.value.scrollTop = offsetTop
  })
}
</script>

<style lang="less" scoped>
.viewport {
  padding: 0 0 0 100px;
  position: fixed;
  width: 300px;
  //height: 400px;
  left: 0;
  top: 80px;
  right: 0;
  bottom: 0;
  margin: 0 auto;
  overflow-y: scroll;
  .scrollbar {
    //height: 2000px;
  }
  .list {
    position: absolute;
    top: 0;
    left: 0;
    .raw {
      //height: 20px;
      height: var(--rowHeight); // 继承并使用
    }
  }
}
</style>
