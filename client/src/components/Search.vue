<template>
  <div class="page-container">
    <!-- Header -->
    <div class="app-header">
      <Title :level="1">本と内容を探す</Title>
      <Text type="secondary"> 本のタイトル・内容をキーワードで検索する </Text>
    </div>

    <!-- Steps -->
    <div class="steps-container">
      <Steps :current="currentStep - 1">
        <Step
          title="本を探す"
          description="本を選択してから内容を検索できます。"
          @click="goBackToBookSearch"
        />
        <Step
          title="内容を探す"
          description="該当する内容が含まれるページを検索する"
          @click="goToContentSearch"
        />
      </Steps>
    </div>

    <!-- Step 1: Book Search -->
    <div v-if="currentStep === 1">
      <!-- Book Search Card -->
      <Card title="本を探す" style="margin-bottom: 24px">
        <InputSearch
          v-model:value="bookQuery"
          placeholder="タイトルから探す"
          size="large"
          name="book-search"
          autocomplete="on"
          :loading="loading"
          @search="searchBooks(1)"
          enter-button="検索"
        />
      </Card>

      <!-- Selected Books -->
      <Card
        v-if="selectedBooks.length > 0"
        title="選択中の本"
        class="selected-books"
      >
        <template #extra>
          <Text type="secondary"> {{ selectedBooks.length }}/10 選択中 </Text>
        </template>

        <div style="margin-bottom: 16px">
          <Tag
            v-for="book in selectedBooks"
            :key="book.id"
            color="blue"
            closable
            @close="removeBook(book)"
            style="margin-bottom: 8px"
          >
            <Space>
              {{ book.name }}
            </Space>
          </Tag>
        </div>

        <Button
          type="primary"
          size="large"
          @click="goToContentSearch"
          :disabled="selectedBooks.length === 0"
        >
          内容検索へ進む
          <template #icon><ArrowRightOutlined /></template>
        </Button>
      </Card>

      <!-- Book Results -->
      <Card v-if="totalBooks > 0" title="検索結果">
        <template #extra>
          <Text type="secondary"> {{ totalBooks }} 件 </Text>
        </template>

        <List
          :data-source="displayedBooks"
          item-layout="vertical"
          :pagination="{
            current: currentPageOfBooks,
            pageSize: PAGE_SIZE,
            total: totalBooks,
            showSizeChanger: false,
            onChange: searchBooks,
          }"
        >
          <template #renderItem="{ item }">
            <ListItem>
              <Card
                :class="['book-card', { selected: isBookSelected(item) }]"
                size="small"
              >
                <template #extra>
                  <Checkbox
                    :checked="isBookSelected(item)"
                    @change="() => toggleBookSelection(item)"
                  />
                </template>

                <CardMeta>
                  <template #title>
                    <Text
                      class="book-name"
                      @click="goToFirstPageOfBook(item.id)"
                    >
                      {{ item.name }}
                    </Text>
                  </template>
                  <template #description>
                    <div>
                      <!-- <Text>by {{ item.author }}</Text> -->
                      <!-- <br /> -->
                      <Text type="secondary">
                        作成日時：
                        {{ new Date(item.created_at).toLocaleString('ja-jp') }}
                      </Text>
                    </div>
                  </template>
                </CardMeta>
              </Card>
            </ListItem>
          </template>
        </List>
      </Card>
    </div>

    <!-- Step 2: Content Search -->
    <div v-if="currentStep === 2">
      <!-- Content Search Card -->
      <Card title="内容を探す" style="margin-bottom: 24px">
        <template #extra>
          <Text type="secondary">
            <span v-if="selectedBooks.length === 0" class="search-by-book-text"
              >すべて</span
            >
            <span v-else class="search-by-book-text"
              >{{ selectedBooks.length }}冊</span
            >の本の中から探す
          </Text>
        </template>

        <InputSearch
          v-model:value="contentQuery"
          placeholder="内容から探す"
          size="large"
          name="content-search"
          autocomplete="on"
          :loading="contentLoading"
          @search="searchContent(1)"
          enter-button="検索"
        />
      </Card>

      <!-- Content Results -->
      <Card v-if="totalPages > 0" title="検索結果">
        <template #extra>
          <Text type="secondary"> {{ totalPages }} 件 </Text>
        </template>

        <List
          :data-source="searchResults"
          item-layout="vertical"
          :pagination="{
            current: currentPageOfPages,
            pageSize: PAGE_SIZE,
            total: totalPages,
            showSizeChanger: false,
            onChange: searchContent,
          }"
        >
          <template #renderItem="{ item }">
            <ListItem>
              <Card class="search-content-card">
                <div style="margin-bottom: 8px">
                  <Space
                    class="title"
                    @click="goToPage(item.book_id, item.page_number)"
                  >
                    <!-- <Icon type="file-text" /> -->
                    <Text strong>{{ item.book_name }}</Text>
                    <Text type="secondary"
                      >• ページ {{ item.page_number }}</Text
                    >
                  </Space>
                </div>

                <Paragraph class="content">
                  <span v-html="highlightText(item.text!, contentQuery)"></span>
                </Paragraph>

                <Text type="secondary" italic>
                  最終編集：
                  {{ new Date(item.updated_at).toLocaleString('ja-jp') }}
                </Text>
              </Card>
            </ListItem>
          </template>
        </List>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Card,
  Typography,
  Steps,
  Step,
  InputSearch,
  Button,
  Tag,
  Space,
  List,
  ListItem,
  CardMeta,
  Checkbox,
} from 'ant-design-vue'
import { ArrowRightOutlined } from '@ant-design/icons-vue'
import { useSearchStore, PAGE_SIZE } from '@/store/search'
import { storeToRefs } from 'pinia'

const { Title, Text, Paragraph } = Typography

const highlightText = (text: string, query: string) => {
  if (!query) return text
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

const searchStore = useSearchStore()
const {
  searchBooks,
  goBackToBookSearch,
  goToContentSearch,
  removeBook,
  isBookSelected,
  toggleBookSelection,
  goToFirstPageOfBook,
  searchContent,
  goToPage,
} = searchStore
const {
  currentStep,
  bookQuery,
  contentQuery,
  totalBooks,
  totalPages,
  displayedBooks,
  selectedBooks,
  searchResults,
  loading,
  currentPageOfBooks,
  currentPageOfPages,
  contentLoading,
} = storeToRefs(searchStore)
</script>

<style>
.highlight {
  background-color: #fff2b8;
  font-weight: 600;
  padding: 0 2px;
  border-radius: 2px;
}

.book-card {
  transition: all 0.3s ease;
  &.selected {
    border-color: #1890ff;
    background-color: #f0f8ff;
  }
}

.book-name {
  cursor: pointer;
  &:hover {
    color: var(--primary-blue);
  }
}

.steps-container {
  margin-bottom: 32px;
  .ant-steps-item-title {
    font-weight: 700;
  }
}

.selected-books {
  margin-bottom: 24px;
}

.app-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-container {
  padding: 24px 0;
}

.search-by-book-text {
  color: var(--text-secondary);
  font-weight: 600;
}

.search-content-card {
  .title {
    flex-wrap: wrap;
    cursor: pointer;
    &:hover {
      .ant-space-item {
        span {
          color: var(--primary-blue);
        }
      }
    }
  }
  .content {
    margin-bottom: 8px;
    line-height: 1.6;
    white-space: pre-line;
  }
}
</style>
