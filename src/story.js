var Story = function(data){
    this.data = data;
};

Story.prototype.getId = function(){
    return this.data.id;
};

module.exports = Story;