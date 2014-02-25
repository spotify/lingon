@test "hello tests" {
  result="$(echo 'hello')"
  [ "$result" == 'hello' ]
}